import React, { useCallback, useRef, useState } from 'react'
import { Share2, Link2, Check, Image as ImageIcon, FileDown, Loader2 } from 'lucide-react'
import { buildShareUrl, type ShareState } from '../lib/shareState'
import {
  renderCard,
  shareOrDownloadImage,
  exportCardAsPdf,
  type ExportCard,
} from '../lib/exportCard'

interface ShareExportBarProps {
  /** Built lazily on click so typing doesn't re-render a canvas. */
  buildCard: () => ExportCard | null
  buildState: () => ShareState
  /** Used for the download filename, e.g. "cgpa". */
  slug: string
  /** Prefill text for the native share sheet. */
  caption?: string
  /** Colour of the accent buttons, matching the owning tab. */
  accent?: 'orange' | 'green' | 'purple'
  disabled?: boolean
}

const SOFT =
  'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'

const ACCENTS: Record<string, string> = {
  orange: 'bg-orange-500 hover:bg-orange-600 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
}

/** Clipboard with a fallback for non-secure contexts (plain http previews). */
const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export default function ShareExportBar({
  buildCard,
  buildState,
  slug,
  caption = 'My UIU calculation',
  accent = 'orange',
  disabled = false,
}: ShareExportBarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  /** Renders the current card onto the offscreen canvas (or returns null). */
  const paint = useCallback((): HTMLCanvasElement | null => {
    const card = buildCard()
    const canvas = canvasRef.current
    if (!card || !canvas) return null
    return renderCard(canvas, card)
  }, [buildCard])

  const handleNativeShare = async () => {
    const url = buildShareUrl(buildState())
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ title: 'UIU Calculator', text: caption, url })
        return
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return
      }
    }
    const ok = await copyText(url)
    notify(ok ? 'Link copied to clipboard' : 'Could not copy — long-press the address bar')
  }

  const handleCopyLink = async () => {
    const ok = await copyText(buildShareUrl(buildState()))
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      notify('Link copied — send it to a friend')
    } else {
      notify('Clipboard blocked by your browser')
    }
  }

  const handleImage = async () => {
    const canvas = paint()
    if (!canvas) return notify('Nothing to export yet')
    setBusy(true)
    try {
      const result = await shareOrDownloadImage(canvas, slug, caption)
      notify(result === 'shared' ? 'Image shared' : 'Image saved to your device')
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') notify('Could not create the image')
    } finally {
      setBusy(false)
    }
  }

  const handlePdf = () => {
    const canvas = paint()
    if (!canvas) return notify('Nothing to export yet')
    exportCardAsPdf(canvas, slug)
    notify('Print dialog opened — pick “Save as PDF”')
  }

  const solid = ACCENTS[accent] ?? ACCENTS.orange
  const base =
    'flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleNativeShare} disabled={disabled} className={`${base} ${SOFT}`} title="Copy or share a link with all your inputs">
          <Share2 size={17} />
          Share
        </button>
        <button type="button" onClick={handleCopyLink} disabled={disabled} className={`${base} ${SOFT}`} title="Copy link">
          {copied ? <Check size={17} /> : <Link2 size={17} />}
          {copied ? 'Copied' : 'Copy Link'}
        </button>
        <button type="button" onClick={handleImage} disabled={disabled || busy} className={`${base} ${solid}`} title="Save a shareable image">
          {busy ? <Loader2 size={17} className="animate-spin" /> : <ImageIcon size={17} />}
          Image
        </button>
        <button type="button" onClick={handlePdf} disabled={disabled} className={`${base} ${SOFT}`} title="Save as PDF">
          <FileDown size={17} />
          PDF
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 bottom-6 z-[60] -translate-x-1/2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium shadow-lg whitespace-nowrap max-w-[92vw] overflow-hidden text-ellipsis"
        >
          {toast}
        </div>
      )}

      {/* Offscreen surface for the PNG/PDF renderer. */}
      <canvas ref={canvasRef} aria-hidden="true" className="hidden" />
    </div>
  )
}

