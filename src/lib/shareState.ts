// Compact, versioned URL codec for the whole calculator state so students can
// send their exact calculation to a friend over WhatsApp/Messenger.
//
// Design notes:
// - Keys are abbreviated to keep the link short enough to fit in a SMS/status.
// - Payload is UTF-8 JSON -> base64url, so the ৳ symbol and any future Bangla
//   text survive round-tripping through a query string.
// - Decoding is fully defensive: a hand-edited or future-version link must never
//   crash the app, it just gets ignored.

export type TabId = 'cgpa' | 'tuition' | 'target'

export interface ShareState {
  /** Format version — bump when the shape changes so old links fail closed. */
  v: 1
  tab: TabId
  /** completedCredit */
  cc?: number
  /** currentCGPA */
  cg?: number
  /** courses, packed as "<credits>:<grade>" */
  co?: string[]
  /** retakes, packed as "<credits>:<newGrade>:<oldGrade>" */
  rt?: string[]
  /** tuitionTotal */
  tt?: number
  /** trimesterFee */
  tf?: number
  /** waiverPct */
  wp?: number
  /** scholarshipPct */
  sp?: number
  /** fydpCredits */
  fc?: number
  /** fydpPerCreditCost */
  fp?: number
  /** targetCGPA */
  tg?: number
  /** targetCredits */
  tc?: number
}

export const SHARE_PARAM = 's'
const FORMAT_VERSION = 1 as const

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(normalized + padding)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Drop keys that are undefined/NaN so the encoded link stays as short as possible. */
const compact = (state: ShareState): ShareState => {
  const out = { v: FORMAT_VERSION, tab: state.tab } as ShareState
  ;(Object.keys(state) as (keyof ShareState)[]).forEach((key) => {
    if (key === 'v') return
    const value = state[key]
    if (value === undefined || value === null) return
    if (typeof value === 'number' && !Number.isFinite(value)) return
    if (Array.isArray(value) && value.length === 0) return
    ;(out as Record<string, unknown>)[key] = value
  })
  return out
}

export const encodeShareState = (state: ShareState): string => {
  try {
    return toBase64Url(JSON.stringify(compact(state)))
  } catch {
    return ''
  }
}

const asFiniteNumber = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

const asPackedList = (value: unknown, parts: number): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  // Only keep well-formed entries; silently skip anything tampered with.
  const clean = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.slice(0, 16))
    .filter((entry) => entry.split(':').length === parts)
  return clean.length > 0 ? clean : undefined
}

const TABS: TabId[] = ['cgpa', 'tuition', 'target']

/** Returns a partial state, or null when there is no / an unusable share param. */
export const decodeShareState = (encoded: string | null): Partial<ShareState> | null => {
  if (!encoded) return null
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.v !== FORMAT_VERSION) return null

    const out: Partial<ShareState> = {}
    out.tab = TABS.includes(parsed.tab as TabId) ? (parsed.tab as TabId) : 'cgpa'

    const numberKeys = ['cc', 'cg', 'tt', 'tf', 'wp', 'sp', 'fc', 'fp', 'tg', 'tc'] as const
    numberKeys.forEach((key) => {
      const n = asFiniteNumber(parsed[key])
      if (n !== undefined) (out as Record<string, unknown>)[key] = n
    })

    const co = asPackedList(parsed.co, 2)
    if (co) out.co = co
    const rt = asPackedList(parsed.rt, 3)
    if (rt) out.rt = rt

    return out
  } catch {
    return null
  }
}

/** True when the incoming shared state actually carries something worth loading. */
export const hasSharedContent = (state: Partial<ShareState> | null): boolean => {
  if (!state) return false
  const numberKeys = ['cc', 'cg', 'tt', 'wp', 'sp', 'tg', 'tc'] as const
  const hasNumber = numberKeys.some((key) => (state as Record<string, unknown>)[key] !== undefined)
  const hasRows = Boolean(state.co?.length || state.rt?.length)
  return hasNumber || hasRows
}

export const buildShareUrl = (state: ShareState): string => {
  const encoded = encodeShareState(state)
  const { origin, pathname } = window.location
  if (!encoded) return `${origin}${pathname}`
  return `${origin}${pathname}?${SHARE_PARAM}=${encoded}`
}

/** Reads + validates the share param from the current address bar. */
export const readSharedState = (): Partial<ShareState> | null => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return decodeShareState(params.get(SHARE_PARAM))
}

/**
 * Strip the (potentially very long) share param once the state has been applied,
 * so the bar is clean and subsequent reloads use localStorage instead.
 */
export const clearShareParam = (): void => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has(SHARE_PARAM)) return
  params.delete(SHARE_PARAM)
  const query = params.toString()
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', url)
}
