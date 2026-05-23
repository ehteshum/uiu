import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

const toDateInputValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10)
  }
  return value.slice(0, 10)
}

export default function AdminInstallments() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [third, setThird] = useState('')
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'installment_dates')
        .single()
      if (!mounted) return
      if (!error && data?.value) {
        try {
          const parsed = JSON.parse(data.value)
          setFirst(toDateInputValue(parsed.first))
          setSecond(toDateInputValue(parsed.second))
          setThird(toDateInputValue(parsed.third))
        } catch {
          // ignore
        }
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (typeof window !== 'undefined' && window.location.pathname !== '/admin' && window.location.hash !== '#/admin') {
    return null
  }

  async function login() {
    setAuthLoading(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('verify_admin_login', {
      p_email: email,
      p_password: password,
    })

    if (error) {
      setMsg(error.message)
      setAuthLoading(false)
      return
    }

    if (!data) {
      setMsg('Invalid email or password')
      setAuthLoading(false)
      return
    }

    setIsAuthed(true)
    setPassword('')
    setMsg('Logged in')
    setAuthLoading(false)
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    const payload = { first: first || null, second: second || null, third: third || null }
    const { error } = await supabase.from('settings').upsert({ key: 'installment_dates', value: JSON.stringify(payload), updated_at: new Date().toISOString() })
    if (error) setMsg(error.message)
    else setMsg('Saved')
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold">Admin Panel</p>
          <h2 className="mt-2 text-2xl font-bold">Installment Dates</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Set only the date for each installment. The public site will show these dates automatically.
          </p>
          <p className="mt-3 text-xs text-gray-500">URL: <span className="font-semibold text-gray-700 dark:text-gray-200">/admin</span></p>
        </div>

        {!isAuthed ? (
          <div className="space-y-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-4 border border-gray-200/70 dark:border-gray-700/70">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="admin@example.com"
              />
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-4 border border-gray-200/70 dark:border-gray-700/70">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                onClick={login}
                disabled={authLoading || !email || !password}
                className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authLoading ? 'Checking…' : 'Login'}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-300 min-h-5">{msg}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            {([
              ['first', '1st Installment'],
              ['second', '2nd Installment'],
              ['third', '3rd Installment'],
            ] as const).map(([key, label]) => (
              <div key={key} className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-4 border border-gray-200/70 dark:border-gray-700/70">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">{label}</label>
                <input
                  type="date"
                  value={key === 'first' ? first : key === 'second' ? second : third}
                  onChange={(e) => {
                    const value = e.target.value
                    if (key === 'first') setFirst(value)
                    if (key === 'second') setSecond(value)
                    if (key === 'third') setThird(value)
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ))}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                onClick={save}
                disabled={saving || loading}
                className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : loading ? 'Loading…' : 'Save Dates'}
              </button>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 min-h-5">
                <span>{msg}</span>
                <button
                  type="button"
                  onClick={() => setIsAuthed(false)}
                  className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
