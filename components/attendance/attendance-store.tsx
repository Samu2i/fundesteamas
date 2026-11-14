'use client'

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  checkInPerson,
  checkOutPerson,
  getSnapshot,
  type ActivityEvent,
  type CheckMethod,
  type DayFlow,
  type PresenceRecord,
  type Punctuality,
} from '@/app/actions/attendance'
import type { Person } from '@/lib/attendance-data'
import { formatTime } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'

export type { ActivityEvent, CheckMethod, PresenceRecord, Punctuality }

type ToastTone = 'success' | 'info' | 'warning'
interface Toast {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

type CheckInResult = { ok: boolean; record: PresenceRecord | null }

interface AttendanceContextValue {
  loading: boolean
  error: boolean
  people: Person[]
  inside: PresenceRecord[]
  activity: ActivityEvent[]
  todayCount: number
  checkOutCount: number
  weekly: DayFlow[]
  totalStudents: number
  punctuality: number
  checkIn: (person: Person, method: CheckMethod) => Promise<CheckInResult>
  checkOut: (personId: string) => Promise<void>
  refresh: () => Promise<unknown>
  notify: (toast: Omit<Toast, 'id'>) => void
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null)

const EMPTY: never[] = []

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR('attendance-snapshot', () => getSnapshot(), {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  })
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

  const offline = useCallback(
    () => notify({ tone: 'warning', title: 'Sin conexión con la base de datos', description: 'Intenta de nuevo en unos segundos.' }),
    [notify],
  )

  const checkIn = useCallback(
    async (person: Person, method: CheckMethod): Promise<CheckInResult> => {
      try {
        const res = await checkInPerson(person.id, method)
        if (!res.record) {
          notify({ tone: 'warning', title: 'No se pudo registrar', description: res.error })
          return { ok: false, record: null }
        }
        if (res.ok) {
          notify({ tone: 'success', title: 'Ingreso registrado', description: `${person.name} · ${formatTime(res.record.entryAt)}` })
        } else {
          notify({
            tone: 'warning',
            title: 'Ya se encuentra dentro',
            description: `${person.name} ingresó a las ${formatTime(res.record.entryAt)}.`,
          })
        }
        await mutate()
        return res
      } catch {
        offline()
        return { ok: false, record: null }
      }
    },
    [mutate, notify, offline],
  )

  const checkOut = useCallback(
    async (personId: string) => {
      const name = data?.inside.find((r) => r.person.id === personId)?.person.name ?? 'La persona'
      try {
        const res = await checkOutPerson(personId)
        if (res.ok) notify({ tone: 'success', title: 'Salida confirmada', description: `${name} salió a las ${formatTime(Date.now())}.` })
        else notify({ tone: 'info', title: 'Sin ingreso activo', description: `${name} no tiene un ingreso abierto hoy.` })
        await mutate()
      } catch {
        offline()
      }
    },
    [data, mutate, notify, offline],
  )

  const value = useMemo<AttendanceContextValue>(
    () => ({
      loading: isLoading,
      error: !!error,
      people: data?.people ?? EMPTY,
      inside: data?.inside ?? EMPTY,
      activity: data?.activity ?? EMPTY,
      todayCount: data?.todayCount ?? 0,
      checkOutCount: data?.checkOutCount ?? 0,
      weekly: data?.weekly ?? EMPTY,
      totalStudents: data?.totalStudents ?? 0,
      punctuality: data?.punctuality ?? 0,
      checkIn,
      checkOut,
      refresh: () => mutate(),
      notify,
    }),
    [data, error, isLoading, checkIn, checkOut, mutate, notify],
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
