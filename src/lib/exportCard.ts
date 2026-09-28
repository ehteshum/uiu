// Zero-dependency result card renderer.
//
// Why hand-drawn on Canvas 2D instead of html2canvas/dom-to-image?
//   * no extra ~40kb dependency in a bundle aimed at low-end Android devices,
//   * immune to Tailwind class / gradient parsing failures that plague DOM
//     snapshotting,
//   * deterministic output and works fully offline.
//
// The card is drawn at 1080px wide — the ideal width for WhatsApp / Messenger /
// Instagram story sharing — and exported as PNG. PDF export reuses the same PNG
// inside a print window so the browser's "Save as PDF" produces a pixel-identical
// document without pulling in jsPDF.

export interface CardMetric {
  label: string
  value: string
  /** Overrides the accent colour used for this value. */
  color?: string
}

export interface ExportCard {
  title: string
  subtitle?: string
  /** Rendered large at the top of the body. */
  highlight?: CardMetric
  metrics: CardMetric[]
  footnotes?: string[]
  /** Hex accent colour, e.g. '#f97316'. */
  accent: string
  dark: boolean
}

const WIDTH = 1080
const PAD = 72
const ROW_HEIGHT = 96
// 272 keeps ~42px of breathing room below a 108px highlight number, whose
// baseline sits at `boxTop + 66 + fontSize`.
const HIGHLIGHT_HEIGHT = 272
const HEADER_HEIGHT = 216
const FOOTER_HEIGHT = 128
const FOOTNOTE_LINE = 42

const FONT_STACK = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, 'Nirmala UI', sans-serif"

const palette = (dark: boolean, accent: string) => ({
  accent,
  page: dark ? '#000000' : '#f3f4f6',
  card: dark ? '#111318' : '#ffffff',
  body: dark ? '#0b0d11' : '#f8fafc',
  title: dark ? '#ffffff' : '#111827',
  label: dark ? '#9ca3af' : '#6b7280',
  divider: dark ? 'rgba(255,255,255,0.09)' : 'rgba(17,24,39,0.10)',
})

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Greedy word-wrap; returns at most `maxLines` lines with an ellipsis on the last. */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  })
  if (current) lines.push(current)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s*\S{0,2}$/, '')}…`
  return kept
}

const measureCardHeight = (card: ExportCard, ctx: CanvasRenderingContext2D): number => {
  let height = HEADER_HEIGHT + FOOTER_HEIGHT + 96
  if (card.highlight) height += HIGHLIGHT_HEIGHT
  height += card.metrics.length * ROW_HEIGHT
  if (card.footnotes?.length) {
    ctx.font = `400 30px ${FONT_STACK}`
    let lines = 0
    card.footnotes.forEach((note) => {
      lines += wrapText(ctx, note, WIDTH - PAD * 2 - 48, 2).length
    })
    height += lines * FOOTNOTE_LINE + 32
  }
  return height
}


/**
 * Draws the card onto the supplied canvas and returns the canvas.
 * The canvas is resized to fit the content, so callers can pass an offscreen
 * or hidden element.
 */
export const renderCard = (canvas: HTMLCanvasElement, card: ExportCard): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  const colors = palette(card.dark, card.accent)

  const height = measureCardHeight(card, ctx)
  canvas.width = WIDTH
  canvas.height = height

  // Page + card surface
  ctx.fillStyle = colors.page
  ctx.fillRect(0, 0, WIDTH, height)
  ctx.fillStyle = colors.card
  roundedRect(ctx, 24, 24, WIDTH - 48, height - 48, 36)
  ctx.fill()

  // ---- Header ------------------------------------------------------------
  const gradient = ctx.createLinearGradient(PAD, 0, WIDTH - PAD, 0)
  gradient.addColorStop(0, card.accent)
  gradient.addColorStop(1, `${card.accent}b3`)

  ctx.fillStyle = gradient
  roundedRect(ctx, PAD, 76, 132, 132, 30)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 56px ${FONT_STACK}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('UIU', PAD + 66, 144)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = colors.title
  ctx.font = `700 52px ${FONT_STACK}`
  const titleLines = wrapText(ctx, card.title, WIDTH - PAD * 2 - 190, 2)
  titleLines.forEach((line, index) => {
    ctx.fillText(line, PAD + 176, 138 + index * 58)
  })
  if (card.subtitle) {
    ctx.fillStyle = colors.label
    ctx.font = `400 32px ${FONT_STACK}`
    ctx.fillText(card.subtitle, PAD + 176, 196)
  }

  ctx.strokeStyle = colors.divider
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, 252)
  ctx.lineTo(WIDTH - PAD, 252)
  ctx.stroke()

  let cursor = 252 + 48

  // ---- Highlight metric --------------------------------------------------
  if (card.highlight) {
    ctx.fillStyle = colors.body
    roundedRect(ctx, PAD, cursor, WIDTH - PAD * 2, HIGHLIGHT_HEIGHT - 56, 26)
    ctx.fill()
    ctx.fillStyle = colors.label
    ctx.font = `500 34px ${FONT_STACK}`
    ctx.fillText(card.highlight.label.toUpperCase(), PAD + 36, cursor + 66)
    const highlightValue = card.highlight.value
    let valueSize = 108
    ctx.font = `800 ${valueSize}px ${FONT_STACK}`
    if (ctx.measureText(highlightValue).width > WIDTH - PAD * 2 - 72) {
      valueSize = 72
      ctx.font = `800 ${valueSize}px ${FONT_STACK}`
    }
    ctx.fillStyle = card.highlight.color || colors.accent
    ctx.fillText(highlightValue, PAD + 36, cursor + 66 + valueSize)
    cursor += HIGHLIGHT_HEIGHT
  }

  // ---- Metric rows -------------------------------------------------------
  card.metrics.forEach((metric, index) => {
    const rowTop = cursor + index * ROW_HEIGHT
    ctx.fillStyle = colors.label
    ctx.font = `400 34px ${FONT_STACK}`
    ctx.textAlign = 'left'
    ctx.fillText(metric.label, PAD, rowTop + 42)

    const maxWidth = WIDTH - PAD * 2 - ctx.measureText(metric.label).width - 48
    let value = metric.value
    ctx.font = `700 40px ${FONT_STACK}`
    if (ctx.measureText(value).width > maxWidth) ctx.font = `700 32px ${FONT_STACK}`
    ctx.fillStyle = metric.color || colors.title
    ctx.textAlign = 'right'
    ctx.fillText(value, WIDTH - PAD, rowTop + 42)
    ctx.textAlign = 'left'

    if (index < card.metrics.length - 1) {
      ctx.strokeStyle = colors.divider
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(PAD, rowTop + ROW_HEIGHT - 12)
      ctx.lineTo(WIDTH - PAD, rowTop + ROW_HEIGHT - 12)
      ctx.stroke()
    }
  })
  cursor += card.metrics.length * ROW_HEIGHT

  // ---- Footnotes ---------------------------------------------------------
  if (card.footnotes?.length) {
    ctx.fillStyle = colors.label
    ctx.font = `400 30px ${FONT_STACK}`
    card.footnotes.forEach((note) => {
      wrapText(ctx, note, WIDTH - PAD * 2 - 60, 2).forEach((line) => {
        ctx.fillText('•', PAD + 6, cursor + 34)
        ctx.fillText(line, PAD + 42, cursor + 34)
        cursor += FOOTNOTE_LINE
      })
    })
  }

  // ---- Footer ------------------------------------------------------------
  const footerY = height - 58
  ctx.strokeStyle = colors.divider
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, footerY - 46)
  ctx.lineTo(WIDTH - PAD, footerY - 46)
  ctx.stroke()

  ctx.fillStyle = colors.accent
  ctx.font = `600 28px ${FONT_STACK}`
  ctx.fillText(window.location.host, PAD, footerY)

  ctx.fillStyle = colors.label
  ctx.font = `400 28px ${FONT_STACK}`
  ctx.textAlign = 'right'
  const stamp = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  })
  ctx.fillText(stamp, WIDTH - PAD, footerY)
  ctx.textAlign = 'left'

  return canvas
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      'image/png',
      1,
    )
  })

const triggerDownload = (href: string, filename: string) => {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const filenameFor = (slug: string, ext: string) => {
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
  return `uiu-${slug}-${day}.${ext}`
}

/**
 * Shares the PNG through the OS share sheet (WhatsApp, Messenger, …) when the
 * browser supports file sharing, otherwise falls back to a normal download.
 * `toDataURL` is called synchronously so the Web Share API stays inside the
 * originating user gesture.
 */
export const shareOrDownloadImage = async (
  canvas: HTMLCanvasElement,
  slug: string,
  caption: string,
): Promise<'shared' | 'downloaded'> => {
  const dataUrl = canvas.toDataURL('image/png')
  const filename = filenameFor(slug, 'png')

  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }

  if (navigatorWithShare.share && navigatorWithShare.canShare) {
    try {
      const blob = await canvasToBlob(canvas)
      const file = new File([blob], filename, { type: 'image/png' })
      const data: ShareData = { files: [file], title: 'UIU Calculator', text: caption }
      if (navigatorWithShare.canShare(data)) {
        await navigatorWithShare.share(data)
        return 'shared'
      }
    } catch (error) {
      // The user dismissing the sheet is not an error worth surfacing.
      if ((error as DOMException)?.name === 'AbortError') throw error
    }
  }

  triggerDownload(dataUrl, filename)
  return 'downloaded'
}

/**
 * Opens a print-ready window containing the rendered card so the browser's
 * "Save as PDF" destination produces a clean, single-page document.
 */
export const exportCardAsPdf = (canvas: HTMLCanvasElement, slug: string): void => {
  const dataUrl = canvas.toDataURL('image/png')
  const ratio = canvas.height / canvas.width

  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) {
    // Pop-up blocked — degrade gracefully to a PNG download.
    triggerDownload(dataUrl, filenameFor(slug, 'png'))
    return
  }

  // 210mm A4 width minus 20mm margins on each side.
  const imgWidthMm = 170
  const imgHeightMm = +(imgWidthMm * ratio).toFixed(1)

  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>UIU ${slug}</title>
    <style>
      @page { size: A4 portrait; margin: 20mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { background: #fff; }
      body { display: flex; justify-content: center; padding: 20mm 0; font-family: system-ui, sans-serif; }
      img { width: ${imgWidthMm}mm; height: auto; display: block; }
      .hint {
        position: fixed; inset: auto 0 0 0; padding: 10px; text-align: center;
        font-size: 13px; color: #555; background: #f3f4f6;
      }
      @media print { .hint { display: none; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="UIU calculation result" />
    <div class="hint">Choose &ldquo;Save as PDF&rdquo; in the print destination, then Save.</div>
    <script>
      window.onload = function () { setTimeout(function () { window.print(); }, 350); };
    </script>
  </body>
</html>`)
  printWindow.document.close()
}

