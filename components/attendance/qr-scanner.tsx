'use client'

import { ScanLine, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { secondaryButton } from './ui'

const QR_PATTERN = Array.from({ length: 36 }, (_, i) => (i * 7) % 3 === 0 || i % 5 === 0)

export function QrScannerDialog({
  title = 'Escaneo rápido QR',
  hint,
  onCancel,
  onDetected,
  durationMs = 2200,
}: {
  title?: string
  hint: string
  onCancel: () => void
  onDetected: () => void
  durationMs?: number
}) {
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  useEffect(() => {
    const t = window.setTimeout(() => onDetectedRef.current(), durationMs)
    return () => window.clearTimeout(t)
  }, [durationMs])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-title"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm fade-in duration-200"
    >
      <div className="w-full max-w-sm animate-in rounded-3xl border bg-card p-6 text-center shadow-2xl zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <h2 id="qr-title" className="font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar escáner"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="relative mx-auto mt-6 size-56 overflow-hidden rounded-2xl bg-muted">
          <div className="absolute inset-6 grid grid-cols-6 gap-1.5 opacity-30" aria-hidden>
            {QR_PATTERN.map((filled, i) => (
              <span key={i} className={cn('rounded-sm', filled ? 'bg-foreground' : 'bg-transparent')} />
            ))}
          </div>
          {[
            'left-3 top-3 border-l-4 border-t-4 rounded-tl-xl',
            'right-3 top-3 border-r-4 border-t-4 rounded-tr-xl',
            'bottom-3 left-3 border-b-4 border-l-4 rounded-bl-xl',
            'bottom-3 right-3 border-b-4 border-r-4 rounded-br-xl',
          ].map((c) => (
            <span key={c} className={cn('absolute size-10 border-primary', c)} aria-hidden />
          ))}
          <span className="animate-scan absolute inset-x-4 h-0.5 rounded-full bg-success shadow-[0_0_16px_4px] shadow-success/60" aria-hidden />
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold">
          <ScanLine className="size-4 animate-pulse text-primary" aria-hidden />
          Buscando código…
        </p>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">{hint}</p>
        <button type="button" autoFocus onClick={onCancel} className={cn(secondaryButton, 'mt-5 w-full')}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
