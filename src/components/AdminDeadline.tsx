import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

export default function AdminDeadline() {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authorized, setAuthorized] = useState(false)
  const adminEnv = (import.meta.env.VITE_ADMIN_EMAILS ?? '') as string
  const allowed = adminEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const session = await supabase.auth.getSession()
      const currentUser = session.data?.session?.user ?? null
      if (mounted) setUser(currentUser)

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tuition_deadline')
        .single()
      if (!mounted) return
      if (!error && data?.value) setValue(data.value)
      setLoading(false)
    }
    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthorized(!!(u?.email && allowed.includes(u.email.toLowerCase())))
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    setAuthorized(!!(user?.email && allowed.includes(user.email.toLowerCase())))
  }, [user])

  async function sendMagicLink(email: string) {
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setMessage('Magic link sent — check your email')
  }

  async function save() {
    if (!authorized) { setMessage('Not authorized'); return }
    setSaving(true)
    setMessage(null)
    const iso = new Date(value).toISOString()
    const { error } = await supabase.from('settings').upsert({ key: 'tuition_deadline', value: iso, updated_at: new Date().toISOString() })
    if (error) setMessage(error.message)
    else setMessage('Saved')
    setSaving(false)
  }

  if (typeof window !== 'undefined' && !(window.location.pathname === '/admin' || window.location.hash === '#/admin')) {
    return null
  }

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 bg-white dark:bg-gray-900 border rounded">
      <h2 className="text-lg font-semibold">Admin — Tuition Deadline</h2>

      {!user && (
        <div className="mt-4">
          <p className="text-sm mb-2">Sign in with your email (magic link).</p>
          <EmailSignIn onSend={sendMagicLink} />
          {message && <div className="mt-2 text-sm">{message}</div>}
        </div>
      )}

      {user && !authorized && (
        <div className="mt-4 text-sm text-red-500">Signed in as {user.email} — not an admin.</div>
      )}

      {user && authorized && (
        <div className="mt-4">
          <div className="flex gap-2 items-center">
            <input type="datetime-local" value={value} onChange={e => setValue(e.target.value)} className="p-2 border rounded w-full bg-transparent" />
            <button onClick={save} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
          {message && <div className="mt-2 text-sm">{message}</div>}
          <div className="mt-2 text-xs text-gray-500">You are signed in as admin: {user.email}</div>
          <div className="mt-3">
            <button className="text-sm text-gray-600 underline" onClick={async () => { await supabase.auth.signOut(); setUser(null); setAuthorized(false) }}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmailSignIn({ onSend }: { onSend: (email: string) => void }) {
  const [email, setEmail] = useState('')
  return (
    <div className="flex gap-2">
      <input className="p-2 border rounded w-full bg-transparent" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={() => onSend(email)} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
    </div>
  )
}

