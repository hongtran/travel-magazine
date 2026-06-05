# Global Nav — Profile Info & Logout — Design Spec

**Date:** 2026-06-05
**Status:** Approved

---

## Overview

All authenticated pages (dashboard, new article, editor) lack any visible indication of who is logged in or a way to sign out. This spec adds a persistent top navigation bar with the current user's display name/email and a sign-out button. The login page is excluded.

---

## Approach

**NavBar in root layout, hidden on `/login` and `/auth/*`.**

A single `AppNav` client component is added to `layout.tsx` as the first child of `<body>`. It reads the current pathname and returns `null` on excluded routes — no layout restructuring required. The editor page's full-height layout is adjusted by 56px to account for the nav bar height.

---

## Component — `AppNav` (`frontend/src/components/AppNav.tsx`)

**Type:** Client component (`'use client'`)

**Behaviour:**
- Uses `usePathname()` to skip rendering on `/login` and any `/auth/*` route
- On mount, calls `supabase.auth.getUser()` to retrieve the current user
- Displays `user.user_metadata.full_name` if present; otherwise falls back to `user.email`
- "Sign out" button calls `supabase.auth.signOut()` then `router.push('/login')`
- Left side: "Magazine Studio" text link pointing to `/dashboard`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Magazine Studio          Hong Tran  ·  Sign out        │
└─────────────────────────────────────────────────────────┘
```

- Height: `h-14` (56px)
- Background: white (`bg-white`)
- Bottom border: `border-b border-stone-200`
- Padding: `px-6`
- Text sizes consistent with existing toolbar (`text-sm`)

**Loading state:** While the user is being fetched, the right side renders nothing (no flash of incorrect state).

---

## Layout change — `frontend/src/app/layout.tsx`

`<AppNav />` inserted as the first child of `<body>`, before `{children}`. No conditional logic needed in the layout — `AppNav` handles its own visibility.

```tsx
<body>
  <AppNav />
  {children}
</body>
```

---

## Editor height fix — `frontend/src/app/articles/[id]/page.tsx`

The editor's outer wrapper changes from `h-screen` to `h-[calc(100vh-56px)]` to account for the 56px nav bar. All internal layout (toolbar, split view) remains unchanged.

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/components/AppNav.tsx` | **New** — nav bar component |
| `frontend/src/app/layout.tsx` | **Modified** — add `<AppNav />` |
| `frontend/src/app/articles/[id]/page.tsx` | **Modified** — `h-screen` → `h-[calc(100vh-56px)]` |

---

## Out of Scope

- Profile editing (name, password)
- Avatar / profile photo
- `/profile` page
- Role display (all current users are authors)
