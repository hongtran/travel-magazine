# Global Nav — Profile Info & Logout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent top nav bar (56px tall) to all authenticated pages showing the app name, the logged-in user's display name, and a sign-out button.

**Architecture:** A single `AppNav` client component is inserted into the root layout. It reads `usePathname()` and returns `null` on `/login` and `/auth/*` routes — no layout restructuring needed. The editor page's `h-screen` wrapper is adjusted by 56px to compensate for the nav height.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui (`Button`), Supabase SSR client (`@/lib/supabase`).

---

## File Structure

```
frontend/src/
  components/
    AppNav.tsx              ← NEW: nav bar component
  app/
    layout.tsx              ← MODIFIED: add <AppNav />
    articles/
      [id]/page.tsx         ← MODIFIED: h-screen → h-[calc(100vh-56px)]
```

---

## Task 1: AppNav component

**Files:**
- Create: `frontend/src/components/AppNav.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/AppNav.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string | null>(null)

  const excluded = pathname === '/login' || pathname.startsWith('/auth/')

  useEffect(() => {
    if (excluded) return
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setDisplayName(user.user_metadata?.full_name ?? user.email ?? null)
    })
  }, [excluded])

  if (excluded) return null

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-stone-200 shrink-0">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-stone-900 hover:text-stone-700"
      >
        Magazine Studio
      </Link>
      <div className="flex items-center gap-4">
        {displayName && (
          <span className="text-sm text-stone-500">{displayName}</span>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
```

**Notes on this component:**
- All four hooks (`usePathname`, `useRouter`, `useState`, `useEffect`) are called unconditionally at the top — this satisfies React's rules of hooks. The early `return null` after the hooks is safe.
- `excluded` is computed before the `useEffect` so the effect can skip the Supabase call on auth routes.
- `displayName` stays `null` until the user fetch resolves — the right side of the nav renders nothing during that window (no flash).
- `user.user_metadata?.full_name` is populated when Supabase is configured to store the name at invite time; it falls back to `user.email` otherwise.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/hongtran/Projects/travel-magazine/frontend
pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors related to `AppNav.tsx`. (The build may fail on other unrelated things — focus only on errors in `AppNav.tsx`.)

- [ ] **Step 3: Commit**

```bash
cd /Users/hongtran/Projects/travel-magazine
git add frontend/src/components/AppNav.tsx
git commit -m "feat: add AppNav component with user display and sign out"
```

---

## Task 2: Integrate AppNav into root layout

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Read the current layout**

Read `frontend/src/app/layout.tsx`. Current content:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Magazine Studio',
  description: 'Travel magazine article generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Add AppNav import and render**

Replace `frontend/src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppNav } from '@/components/AppNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Magazine Studio',
  description: 'Travel magazine article generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        <AppNav />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hongtran/Projects/travel-magazine
git add frontend/src/app/layout.tsx
git commit -m "feat: render AppNav in root layout"
```

---

## Task 3: Fix editor full-height layout

**Files:**
- Modify: `frontend/src/app/articles/[id]/page.tsx`

The editor uses `h-screen` for its outermost wrapper so the split-view fills the viewport. With the 56px nav bar now present, `h-screen` causes the bottom of the editor to be cut off. Fix it to `h-[calc(100vh-56px)]`.

- [ ] **Step 1: Update the outer wrapper class**

In `frontend/src/app/articles/[id]/page.tsx`, find line 48:

```tsx
    <div className="h-screen flex flex-col overflow-hidden">
```

Change it to:

```tsx
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
```

No other changes — the inner toolbar, split panes, and overflow settings are all unaffected.

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/hongtran/Projects/travel-magazine/frontend
pnpm build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/hongtran/Projects/travel-magazine
git add frontend/src/app/articles/[id]/page.tsx
git commit -m "fix: adjust editor height to account for 56px nav bar"
```

---

## Task 4: Visual verification

Start the dev server and manually verify all three authenticated pages show the nav bar correctly, and that the login page does not.

- [ ] **Step 1: Start dev server**

```bash
cd /Users/hongtran/Projects/travel-magazine/frontend
pnpm dev
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 2: Verify login page has no nav**

Navigate to `http://localhost:3000/login`. Confirm:
- No nav bar is visible
- The login form is centered as before

- [ ] **Step 3: Verify dashboard nav**

Sign in (or use an existing session) and navigate to `/dashboard`. Confirm:
- Nav bar appears at the top with "Magazine Studio" on the left
- User email or name appears on the right
- "Sign out" button is visible

- [ ] **Step 4: Verify new-article page nav**

Navigate to `/articles/new`. Confirm:
- Same nav bar appears at the top
- Page content (upload widget) is below the nav — nothing clipped

- [ ] **Step 5: Verify editor page nav + height**

Open any article at `/articles/<id>`. Confirm:
- Nav bar appears at the top
- The editor split-view fills the rest of the viewport without any bottom overflow or clipping
- Scrolling within the left (fields) pane works normally

- [ ] **Step 6: Verify sign-out**

Click "Sign out". Confirm:
- Redirected to `/login`
- Session is cleared (refreshing `/dashboard` redirects back to `/login`)
