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

  const supabase = createClient()
  const excluded = pathname === '/login' || pathname.startsWith('/auth/')

  useEffect(() => {
    if (excluded) return
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) { console.error('Failed to fetch user:', error.message); return }
      if (!user) return
      setDisplayName(user.user_metadata?.full_name ?? user.email ?? null)
    })
  }, [excluded])

  if (excluded) return null

  async function handleSignOut() {
    // createBrowserClient (@supabase/ssr) uses cookies as auth storage.
    // signOut() removes those cookies so the middleware sees no session on the next request.
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error.message)
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
