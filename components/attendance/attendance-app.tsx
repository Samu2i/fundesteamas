'use client'

import {
  CalendarClock,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { formatLongDate, formatTime } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import { AttendanceProvider, useAttendance, useNow } from './attendance-store'
import { CheckInView } from './check-in-view'
import { CheckOutView } from './check-out-view'
import { DashboardView } from './dashboard-view'
import { ScheduleView } from './schedule-view'

export type ViewId = 'inicio' | 'ingreso' | 'salida' | 'horarios'

export const NAV: { id: ViewId; label: string; short: string; description: string; icon: LucideIcon }[] = [
  { id: 'inicio', label: 'Inicio', short: 'Inicio', description: 'Resumen de la jornada', icon: LayoutDashboard },
  { id: 'ingreso', label: 'Registro de ingreso', short: 'Ingreso', description: 'Marcar entradas', icon: LogIn },
  { id: 'salida', label: 'Confirmación de salida', short: 'Salida', description: 'Personas dentro', icon: LogOut },
  { id: 'horarios', label: 'Consulta de horarios', short: 'Horarios', description: 'Bloques y clases', icon: CalendarClock },
]

const subscribe = () => () => {}

export function AttendanceApp() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex size-10 animate-pulse items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="font-heading font-semibold">Cargando Fundesteam…</span>
        </div>
      </div>
    )
  }

  return (
    <AttendanceProvider>
      <Shell />
    </AttendanceProvider>
  )
}

function Shell() {
  const [view, setView] = useState<ViewId>('inicio')
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const navigate = (next: ViewId) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const current = NAV.find((n) => n.id === view)!

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar view={view} onNavigate={navigate} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={current.label} dark={dark} onToggleTheme={() => setDark((d) => !d)} />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div key={view} className="animate-rise">
            {view === 'inicio' && <DashboardView onNavigate={navigate} />}
            {view === 'ingreso' && <CheckInView />}
            {view === 'salida' && <CheckOutView onNavigate={navigate} />}
            {view === 'horarios' && <ScheduleView />}
          </div>
        </main>
      </div>

      <MobileNav view={view} onNavigate={navigate} />
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="font-heading text-base font-bold tracking-tight">Fundesteam</p>
        <p className="text-xs text-muted-foreground">Control de asistencia</p>
      </div>
    </div>
  )
}

function Sidebar({ view, onNavigate }: { view: ViewId; onNavigate: (v: ViewId) => void }) {
  const { inside } = useAttendance()
  const capacity = 40
  const pct = Math.min(100, Math.round((inside.length / capacity) * 100))

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r bg-card/70 px-5 py-6 backdrop-blur lg:flex">
      <Logo />

      <nav aria-label="Módulos" className="mt-10 flex flex-col gap-1.5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Módulos</p>
        {NAV.map((item) => {
          const active = item.id === view
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {active && <span className="absolute inset-y-2 -left-5 w-1 rounded-r-full bg-primary" aria-hidden />}
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'bg-muted group-hover:bg-card group-hover:text-primary',
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Dentro de la sede</p>
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
        </div>
        <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
          {inside.length}
          <span className="text-sm font-medium text-muted-foreground"> / {capacity} en monitoreo</span>
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Ocupación monitoreada"
        >
          <div
            className="h-full rounded-full bg-success transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </aside>
  )
}

function TopBar({ title, dark, onToggleTheme }: { title: string; dark: boolean; onToggleTheme: () => void }) {
  const now = useNow(1000)
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="hidden flex-col lg:flex">
          <p className="text-xs text-muted-foreground first-letter:uppercase">{formatLongDate(now)}</p>
          <p className="font-heading text-sm font-semibold">{title}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 sm:flex">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            <time className="font-heading text-sm font-semibold tabular-nums">{formatTime(now, true)}</time>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          >
            {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          </button>
          <div className="hidden items-center gap-3 border-l pl-3 md:flex">
            <span className="flex size-10 items-center justify-center rounded-xl bg-foreground/10 font-heading text-sm font-semibold">
              PL
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Patricia Londoño</p>
              <p className="text-xs text-muted-foreground">Coordinación</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileNav({ view, onNavigate }: { view: ViewId; onNavigate: (v: ViewId) => void }) {
  return (
    <nav
      aria-label="Módulos"
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border bg-card/90 p-1.5 shadow-xl shadow-foreground/10 backdrop-blur-xl lg:hidden"
    >
      {NAV.map((item) => {
        const active = item.id === view
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-all',
              active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-5" aria-hidden />
            {item.short}
          </button>
        )
      })}
    </nav>
  )
}
