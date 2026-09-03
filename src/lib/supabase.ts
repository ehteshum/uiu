import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in .env locally and in Vercel Project Settings > Environment Variables, then redeploy.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

// Map low-level network failures (e.g. DNS NXDOMAIN, paused/deleted project,
// offline, ad-blocker) to an actionable message instead of raw "Failed to fetch".
export function friendlySupabaseError(err: unknown): string {
  const raw =
    (typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err ?? '')) || 'Unknown error'

  if (/failed to fetch|load failed|networkerror|network request failed/i.test(raw)) {
    let host = supabaseUrl
    try {
      host = supabaseUrl ? new URL(supabaseUrl).host : '(Supabase URL is missing)'
    } catch {
      host = supabaseUrl || '(Supabase URL is invalid)'
    }
    return (
      `Cannot reach the database at ${host}. ` +
      `Check that the Supabase project exists / is not paused, ` +
      `VITE_SUPABASE_URL is correct, and you redeployed after changing env vars. ` +
      `(${raw})`
    )
  }

  return raw
}

export default supabase
