import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

export default function DeadlineDisplay() {
  const [deadline, setDeadline] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tuition_deadline')
        .single()
      if (!mounted) return
      if (error) {
        setDeadline(null)
      } else {
        setDeadline(data?.value ?? null)
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="text-sm text-gray-600 dark:text-gray-300">Loading deadline…</div>
  if (!deadline) return <div className="text-sm text-gray-600 dark:text-gray-300">No tuition deadline set.</div>
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return <div className="text-sm text-gray-600 dark:text-gray-300">Invalid deadline value</div>
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      Tuition payment deadline: <span className="font-semibold">{d.toLocaleString()}</span>
    </div>
  )
}
