'use client'

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DIRECTORY, INITIAL_INSIDE, type Person } from '@/lib/attendance-data'
import { formatTime } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'

export type CheckMethod = 'Manual' | 'QR'
export type Punctuality = 'Puntual' | 'Tardío'

export interface PresenceRecord {
  person: Person
  entryAt: number
  status: Punctuality
  method: CheckMethod
}

export interface ActivityEvent {
  id: string
  kind: 'in' | 'out'
  person: Person
  at: number
  method?: CheckMethod
}

type ToastTone = 'success' | 'info' | 'warning'
interface Toast {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface AttendanceContextValue {
  inside: PresenceRecord[]
  activity: ActivityEvent[]
  todayCount: number
  checkOutCount: number
  checkIn: (person: Person, method: CheckMethod) => { ok: boolean; record: PresenceRecord }
  checkOut: (personId: string) => void
  notify: (toast: Omit<Toast, 'id'>) => void
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null)

function punctualityFor(person: Person, at: Date): Punctuality {
  const shiftStart = person.shift === 'Mañana' ? 7 * 60 : 13 * 60
  const minutes = at.getHours() * 60 + at.getMinutes()
  return minutes <= shiftStart + 10 ? 'Puntual' : 'Tardío'
}

function buildInitialInside(): PresenceRecord[] {
  const now = Date.now()
  return INITIAL_INSIDE.flatMap((seed) => {
    const person = DIRECTORY.find((p) => p.id === seed.id)
    if (!person) return []
    return [{ person, entryAt: now - seed.minutesAgo * 60000, status: seed.status, method: seed.method }]
  }).sort((a, b) => b.entryAt - a.entryAt)
}

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [inside, setInside] = useState<PresenceRecord[]>(buildInitialInside)
  const [activity, setActivity] = useState<ActivityEvent[]>(() =>
    buildInitialInside().map((r) => ({
      id: `seed-${r.person.id}`,
      kind: 'in' as const,
      person: r.person,
      at: r.entryAt,
      method: r.method,
    })),
  )
  const [todayCount, setTodayCount] = useState(986)
  const [checkOutCount, setCheckOutCount] = useState(214)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = ++toastId.current
      setToasts((list) => [...list.slice(-2), { ...toast, id }])
      timers.current.push(window.setTimeout(() => dismiss(id), 3800))
    },
    [dismiss],
  )

  const checkIn = useCallback(
    (person: Person, method: CheckMethod) => {
      const existing = inside.find((r) => r.person.id === person.id)
      if (existing) {
        notify({
          tone: 'warning',
          title: 'Ya se encuentra dentro',
          description: `${person.name} ingresó a las ${formatTime(existing.entryAt)}.`,
        })
        return { ok: false, record: existing }
      }
      const now = new Date()
      const record: PresenceRecord = { person, entryAt: now.getTime(), status: punctualityFor(person, now), method }
      setInside((list) => [record, ...list])
      setActivity((list) => [{ id: `in-${now.getTime()}`, kind: 'in', person, at: now.getTime(), method }, ...list])
      setTodayCount((c) => c + 1)
      notify({ tone: 'success', title: 'Ingreso registrado', description: `${person.name} · ${formatTime(now)}` })
      return { ok: true, record }
    },
    [inside, notify],
  )

  const checkOut = useCallback(
    (personId: string) => {
      const record = inside.find((r) => r.person.id === personId)
      if (!record) return
      const now = Date.now()
      setInside((list) => list.filter((r) => r.person.id !== personId))
      setActivity((list) => [{ id: `out-${now}`, kind: 'out', person: record.person, at: now }, ...list])
      setCheckOutCount((c) => c + 1)
      notify({
        tone: 'success',
        title: 'Salida confirmada',
        description: `${record.person.name} salió a las ${formatTime(now)}.`,
      })
    },
    [inside, notify],
  )

  const value = useMemo(
    () => ({ inside, activity, todayCount, checkOutCount, checkIn, checkOut, notify }),
    [inside, activity, todayCount, checkOutCount, checkIn, checkOut, notify],
  )

  return (
    <AttendanceContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </AttendanceContext.Provider>
  )
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext)
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider')
  return ctx
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}

const TONE_ICON = { success: CircleCheck, info: Info, warning: CircleAlert }

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto sm:w-96 sm:flex-col-reverse lg:bottom-8"
    >
      {toasts.map((toast) => {
        const Icon = TONE_ICON[toast.tone]
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full animate-in items-start gap-3 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl shadow-foreground/10 fade-in slide-in-from-top-2 duration-300',
              toast.tone === 'success' && 'glow-ring',
              toast.tone === 'warning' && 'border-destructive/40',
            )}
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl',
                toast.tone === 'success' && 'bg-success/15 text-success',
                toast.tone === 'info' && 'bg-primary/10 text-primary',
                toast.tone === 'warning' && 'bg-destructive/10 text-destructive',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar notificación"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
