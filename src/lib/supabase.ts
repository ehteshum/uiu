import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  // runtime will still work but calls will fail; keep silent in build
}

export const supabase = createClient(url ?? '', anon ?? '')

export default supabase
