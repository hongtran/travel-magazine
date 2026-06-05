'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUrlError(params.get('error'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })
    if (error) {
      setFormError("This email isn't registered. Contact your admin to get an invite.")
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-xl shadow-sm border border-stone-200">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Magazine Studio</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to your editorial account</p>
        </div>
        {sent ? (
          <p className="text-sm text-stone-600">
            Check your email — we sent you a magic link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {(formError || urlError === 'invite_expired') && (
              <p className="text-sm text-red-600">
                {formError ?? 'This link has expired or is invalid. Contact your admin.'}
              </p>
            )}
            <Input
              type="email"
              placeholder="you@seeksophie.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
