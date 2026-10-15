import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Share2, Link2, Check, Image as ImageIcon, FileDown, Loader2, ChevronDown } from 'lucide-react'
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
  /** Colour of the accent button, matching the owning tab. */
  accent?: 'orange' | 'green' | 'purple'
  disabled?: boolean
}

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

interface MenuItemProps {
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

function MenuItem({ icon, onClick, disabled, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      {children}
    </button>
  )
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
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

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

  const run = (action: () => void | Promise<void>) => () => {
    setOpen(false)
    void action()
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Share or export your result"
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-300 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${solid}`}
      >
        <Share2 size={18} />
        Share
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share and export options"
          className="absolute left-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          <MenuItem icon={<Share2 size={18} />} onClick={run(handleNativeShare)}>
            Share link
          </MenuItem>
          <MenuItem
            icon={copied ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
            onClick={run(handleCopyLink)}
          >
            {copied ? 'Link copied' : 'Copy link'}
          </MenuItem>
          <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
          <MenuItem
            icon={busy ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            onClick={run(handleImage)}
            disabled={busy}
          >
            Save as image
          </MenuItem>
          <MenuItem icon={<FileDown size={18} />} onClick={run(handlePdf)}>
            Save as PDF
          </MenuItem>
        </div>
      )}

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
