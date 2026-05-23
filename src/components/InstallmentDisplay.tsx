import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

type Dates = { first?: string; second?: string; third?: string }

export default function InstallmentDisplay() {
  const [dates, setDates] = useState<Dates | null>(null)
  const [loading, setLoading] = useState(true)

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
      if (error || !data?.value) {
        setDates(null)
      } else {
        try {
          const parsed = JSON.parse(data.value)
          setDates(parsed)
        } catch {
          setDates(null)
        }
      }
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 60_000) // refresh every minute
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  if (loading) return <div className="text-sm text-gray-600 dark:text-gray-300">Loading deadlines…</div>
  if (!dates) return <div className="text-sm text-gray-600 dark:text-gray-300">No installment dates set.</div>

  const fmt = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'Invalid'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded shadow-sm">
      <div className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">Installment Dates</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="text-xs text-gray-600 dark:text-gray-400">First: <span className="font-semibold">{fmt(dates.first)}</span></div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Second: <span className="font-semibold">{fmt(dates.second)}</span></div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Third: <span className="font-semibold">{fmt(dates.third)}</span></div>
      </div>
    </div>
  )
}
