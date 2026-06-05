# Technical Assessment — Seek Sophie Article Generator

**Date:** 2026-06-05  
**Scope:** v1 production readiness — problems identified, trade-offs made, failure handling, structured output quality, hallucination mitigation.

---

## 1. Problem Identification

### What was identified correctly

- **Two-step pipeline** (parse → generate as separate endpoints) was a non-obvious product decision. It enables per-step progress UI and retry-without-re-upload, and decouples the expensive LLM call from file I/O.
- **`key_facts` as `list[KeyFact]` not `dict[str, SourcedField]`** — OpenAI Structured Outputs rejects arbitrary-keyed dicts. This would have been a hard runtime failure caught here before it hit production.
- **Author comments and tracked changes** extracted alongside body text. These often contain the most specific facts (prices, dates, opinions) and are easy to miss if you only read paragraphs.
- **`source_ref` gap** — the citation snippet was collected and stored but never shown to authors. Data was there; the tool wasn't. Surfaced and fixed.
- **Regeneration without style controls is not a feature** — undirected regeneration produces near-identical output and teaches authors nothing. Deferred to v2 rather than shipped half-built.
- **Daily generation limit** identified as the simplest effective cost control before it became a surprise bill.

### Still open

| Risk | Detail |
|---|---|
| JWKS cache has no TTL | `auth.py` fetches the Supabase public key once and caches it forever. Key rotation silently 401s all users until process restart. |
| Synchronous generation timeout | GPT-4o on a long summarised doc can take 30–40s. Railway's default HTTP timeout is 30s. Latent production failure. |
| Orphaned pending images | If generation fails after parse uploads images to `articles/pending/`, those files are never cleaned up. No TTL, no cleanup job. |
| `_detect_multiple_experiences` is inert | Matches literal strings `"experience 1"`, `"part 2"`. Real notes say "Day 1 in Bali, then Lombok". Warning almost never fires. |
| Concurrent generation race | Two simultaneous requests can both pass the daily limit check before either inserts a row. Limit is not atomic. |

---

## 2. Trade-offs

### Explicit — documented in spec

| Decision | Alternative considered | Reason |
|---|---|---|
| Two-step parse + generate | Single endpoint | Progress visibility; retry without re-upload |
| `list[KeyFact]` | `dict[str, SourcedField]` | OpenAI Structured Outputs hard constraint on arbitrary keys |
| `verified` as separate author flag | Mutating `sourced: true` | Preserves LLM metadata as immutable; human sign-off is additive |
| Daily limit via `app_config` | Content hash dedup / token budget | Simplest effective control; admin-configurable without a deploy |
| Regeneration deferred to v2 | Ship with no style controls | Undirected regeneration is not a reliable author workflow |
| `parsedTextAtom` in-memory only | Persist parsed text to DB | Simplicity; limitation documented — Regenerate disabled after navigation |
| mammoth as python-docx fallback | Hard fail on bad docx | Resilience; most parse failures recover silently |
| Download-then-upload for image move | Supabase `move()` API | Avoids known move API quirks with non-standard content types |

### Still implicit — not yet documented

- **Synchronous HTTP vs. job queue.** The biggest undocumented trade-off. Long generations can timeout. A job queue (even a simple Supabase Realtime channel) would fix this but adds infrastructure. Not discussed in spec.
- **Single LLM provider.** No fallback if OpenAI is down. GPT-4o-mini as same-provider fallback was discussed but not implemented. Cross-provider (Anthropic/Gemini) rejected as over-engineering for v1.
- **Keyword heuristic for multi-experience detection.** LLM-based detection would be more reliable but costs an extra API call per upload. Cheap heuristic chosen but barely works in practice.

---

## 3. Unhappy Path Handling

### Covered

| Failure | Handling |
|---|---|
| Wrong file type | 422, red banner above upload widget |
| Empty / too-short doc | 422, red banner |
| Corrupt / password-protected `.docx` | python-docx exception → mammoth fallback; if both fail → 422 |
| GPT-4o timeout or malformed output | Retry once; on second failure → 500, red banner, widget stays active |
| Daily generation limit | 429, red banner with exact count and reset message |
| Auth missing | 403 (HTTPBearer default) |
| Auth invalid / expired | 401, frontend redirects to `/login` |
| Unsourced fields at publish | Confirmation dialog listing field names; verified fields excluded |
| All upload errors | Consistent red banner UI; widget never disabled after error — author can retry immediately |

### Weak spots

- **Storage failures unhandled.** `upload_docx` and `upload_pending_image` have no `try/except`. Supabase Storage outage → unhandled 500 with no user-facing message.
- **Cannot clear a field to empty via PATCH.** `ArticleUpdate.model_dump(exclude_none=True)` silently ignores `None` values. An author who wants to blank ethics notes cannot do so.
- **Daily limit timezone.** Uses `date.today()` (server local time). If Railway's container timezone ≠ Singapore time, the reset window is wrong for authors.

---

## 4. Structured Output Quality

**Genuinely structured — not prose with a schema sprinkled on top.**

- Every field in `ArticleOutput` carries `{value, sourced, source_ref}`. Schema enforces per-field confidence metadata, not just content.
- `list[KeyFact]` with `{key, value, sourced, source_ref}` per entry — no arbitrary dict keys that Structured Outputs can't enforce.
- System prompt has actionable grounding rules: *"NEVER invent facts. Set `sourced: false` if inferred. `source_ref` must be a verbatim ≤30-word snippet."*
- `source_ref` rendered in the editor for all field types (top-level fields, key facts, body sections) — citation is visible, not buried in a DB column.
- `verified` flag separates LLM confidence from human sign-off. LLM metadata is immutable; author review is additive.

**One spec divergence:** The Pydantic schema block in the spec still shows `key_facts: dict[str, SourcedField]`. The actual implementation uses `list[KeyFact]`. Spec needs correcting.

---

## 5. Accuracy and Hallucination Handling

### The system is layered

```
1. Prompt-level grounding     → strict rules; null-not-fabricate instruction
2. Per-field confidence        → sourced: bool flags LLM uncertainty
3. Citation transparency       → source_ref shown in editor for every field + body section
4. Actionable amber state      → edit or explicitly verify; not just a passive warning
5. Persistent verification     → verified: true survives refresh; excluded from publish count
6. Publish friction            → unverified fields named in dialog before publish
```

### What it catches well

- LLM-acknowledged uncertainty (`sourced: false`): flagged amber, requires author action before clean publish.
- Missing information: LLM returns `null` for fields it can't fill rather than inventing.
- Traceable sourcing: every green field shows what the LLM cited, so authors can spot plausible-but-wrong citations.

### What it does not catch

| Gap | Detail |
|---|---|
| Confident hallucinations | `sourced: true` with a fabricated `source_ref` is invisible. The amber system only fires when the LLM doubts itself. A confident wrong answer gets a green citation. |
| No server-side citation verification | `source_ref` is self-reported. There is no check that the snippet actually appears in the original parsed text. |
| Body section confidence | Body sections have `source_ref` in the schema and it's now shown in the editor, but there is no `sourced` flag per section — an invented paragraph looks identical to a grounded one. |
| Hard publish block | "Publish anyway" is always available. For safety-critical content (prices, warnings, seasonal conditions), the friction is advisory only. |

---

## Summary

| Dimension | Status |
|---|---|
| Problem identification | Strong. Core unknowns caught early. Three open risks (JWKS, timeout, orphaned images) need addressing before scale. |
| Trade-offs | Well-documented for build decisions. Synchronous generation timeout is the largest undocumented risk. |
| Unhappy path | Good coverage of user-facing failures. Storage failures and field-clearing via PATCH are the main gaps. |
| Structured output | Genuinely structured. `list[KeyFact]` and per-field sourcing are solid. One spec/code divergence on `key_facts` type. |
| Accuracy | Best-designed part of the system. Handles acknowledged uncertainty well. Does not catch confident hallucinations — the practical risk for a travel app publishing prices and safety info. |
