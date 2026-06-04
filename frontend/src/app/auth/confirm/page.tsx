'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      // Explicitly set session from hash tokens — stores in cookies for SSR
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        router.replace(error ? '/login?error=invite_expired' : '/dashboard')
      })
    } else {
      // No hash tokens — check if already logged in, otherwise bail
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/dashboard' : '/login?error=invite_expired')
      })
    }
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-sm text-stone-400">Signing you in…</p>
    </main>
  )
}
