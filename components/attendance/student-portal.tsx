'use client'

import {
  BookOpen,
  CalendarClock,
  CircleCheck,
  Clock,
  GraduationCap,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  QrCode,
  ScanLine,
  Sun,
  UserRound,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { DAYS, SCHEDULE, type Person } from '@/lib/attendance-data'
import { formatDuration, formatLongDate, formatTime, getSessionStatus, mondayIndex } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import { useAttendance, useNow, type Punctuality } from './attendance-store'
import { QrScannerDialog } from './qr-scanner'
import { DayView } from './schedule-view'
import { Avatar, EmptyState, Panel, SectionHeader, StatusPill } from './ui'

type StudentTab = 'acceso' | 'clases'

const TABS: { id: StudentTab; label: string; icon: typeof QrCode }[] = [
  { id: 'acceso', label: 'Mi acceso', icon: QrCode },
  { id: 'clases', label: 'Mis clases', icon: CalendarClock },
]

export function StudentPortal({
  person,
  dark,
  onToggleTheme,
  onLogout,
}: {
  person: Person
  dark: boolean
  onToggleTheme: () => void
  onLogout: () => void
}) {
  const [tab, setTab] = useState<StudentTab>('acceso')

  const go = (next: StudentTab) => {
    setTab(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-base font-bold">Fundesteam</p>
              <p className="text-xs text-muted-foreground">Portal estudiantil</p>
            </div>
          </div>

          <nav aria-label="Secciones" className="hidden gap-1 rounded-xl border bg-muted/60 p-1 md:flex">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = t.id === tab
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                    active ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className={cn('size-4', active && 'text-primary')} aria-hidden />
                  {t.label}
                </button>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
            >
              {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            </button>
            <div className="hidden items-center gap-3 border-l pl-3 sm:flex">
              <Avatar name={person.name} role={person.role} />
              <div className="leading-tight">
                <p className="text-sm font-semibold">{person.name}</p>
                <p className="text-xs text-muted-foreground">Grupo {person.course}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:pt-8">
        <div key={tab} className="animate-rise">
          {tab === 'acceso' ? <AccessTab person={person} onSeeClasses={() => go('clases')} /> : <ClassesTab person={person} />}
        </div>
      </main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-2 gap-1 rounded-2xl border bg-card/90 p-1.5 shadow-xl shadow-foreground/10 backdrop-blur-xl md:hidden"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-all',
                active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

type ScanResult = { kind: 'in'; at: number; status: Punctuality; duplicate: boolean } | { kind: 'out'; at: number }

function AccessTab({ person, onSeeClasses }: { person: Person; onSeeClasses: () => void }) {
  const { inside, activity, checkIn, checkOut } = useAttendance()
  const now = useNow(1000)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)

  const record = inside.find((r) => r.person.id === person.id)
  const myEvents = activity.filter((e) => e.person.id === person.id).slice(0, 6)
  const firstName = person.name.split(' ')[0]

  const handleDetected = async () => {
    setScanning(false)
    if (record) {
      await checkOut(person.id)
      setResult({ kind: 'out', at: Date.now() })
    } else {
      const res = await checkIn(person, 'QR')
      if (res.record) setResult({ kind: 'in', at: res.record.entryAt, status: res.record.status, duplicate: !res.ok })
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/25 sm:p-8">
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-primary-foreground/75 first-letter:uppercase">{formatLongDate(now)}</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Hola, {firstName}</h1>
            <p
              className={cn(
                'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1',
                record ? 'bg-success/20 ring-success/40' : 'bg-primary-foreground/15 ring-primary-foreground/25',
              )}
            >
              <span className={cn('size-2 rounded-full', record ? 'bg-success' : 'bg-primary-foreground/60')} aria-hidden />
              {record
                ? `Estás dentro desde las ${formatTime(record.entryAt)} · ${formatDuration(now.getTime() - record.entryAt)}`
                : 'Aún no registras ingreso en este momento'}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-primary-foreground px-6 py-4 font-heading text-base font-semibold text-primary shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                <ScanLine className="size-5" aria-hidden />
              </span>
              {record ? 'Escanear QR de salida' : 'Escanear QR de ingreso'}
            </button>
            <p className="text-pretty text-sm text-primary-foreground/75">Apunta la cámara al código QR ubicado en portería.</p>
          </div>
        </div>

        {result && (
          <div
            key={result.at}
            role="status"
            className="relative mt-6 flex animate-rise items-center gap-4 rounded-2xl bg-card p-4 text-card-foreground shadow-lg"
          >
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full',
                result.kind === 'in' && result.duplicate ? 'bg-destructive/10 text-destructive' : 'bg-success text-success-foreground',
              )}
            >
              <CircleCheck className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {result.kind === 'out' ? 'Salida registrada' : result.duplicate ? 'Ya tenías un ingreso activo' : 'Ingreso registrado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {result.kind === 'out' ? '¡Hasta pronto! Que tengas una buena tarde.' : 'Bienvenido a la sede principal.'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading text-xl font-semibold tabular-nums">{formatTime(result.at, true)}</p>
              {result.kind === 'in' && !result.duplicate && (
                <StatusPill tone={result.status === 'Puntual' ? 'success' : 'warning'}>{result.status}</StatusPill>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <StudentCard person={person} />

        <div className="flex flex-col gap-6 lg:col-span-3">
          <NextClassCard person={person} onSeeClasses={onSeeClasses} />

          <Panel className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Mi registro de hoy</h2>
            {myEvents.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Sin movimientos todavía"
                description="Cuando escanees el código de portería, tus ingresos y salidas aparecerán aquí."
                className="py-8"
              />
            ) : (
              <ol className="mt-4 flex flex-col">
                {myEvents.map((e, i) => (
                  <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < myEvents.length - 1 && <span className="absolute left-4 top-9 bottom-0 w-px bg-border" aria-hidden />}
                    <span
                      className={cn(
                        'relative flex size-8 shrink-0 items-center justify-center rounded-full',
                        e.kind === 'in' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
                      )}
                    >
                      {e.kind === 'in' ? <LogIn className="size-4" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
                    </span>
                    <div className="flex flex-1 items-center justify-between gap-3 pt-1">
                      <div>
                        <p className="text-sm font-semibold">{e.kind === 'in' ? 'Ingreso a la sede' : 'Salida de la sede'}</p>
                        <p className="text-xs text-muted-foreground">{e.method === 'QR' ? 'Código QR' : 'Registro en portería'}</p>
                      </div>
                      <span className="font-heading text-sm font-semibold tabular-nums">{formatTime(e.at)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>

      {scanning && (
        <QrScannerDialog
          title={record ? 'Escanear QR de salida' : 'Escanear QR de ingreso'}
          hint="Mantén el código de portería dentro del recuadro hasta que se confirme el registro."
          onCancel={() => setScanning(false)}
          onDetected={handleDetected}
        />
      )}
    </div>
  )
}

function StudentCard({ person }: { person: Person }) {
  return (
    <Panel className="card-glow overflow-hidden lg:col-span-2">
      <div className="relative bg-primary px-5 py-4 text-primary-foreground">
        <div className="dot-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex items-center justify-between">
          <p className="font-heading text-sm font-semibold">Carné estudiantil</p>
          <p className="text-xs text-primary-foreground/75">Fundesteam · 2026</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-5 p-6">
        <div className="flex w-full items-center gap-4">
          <Avatar name={person.name} role={person.role} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{person.name}</p>
            <p className="text-sm text-muted-foreground">Grupo {person.course} · Jornada {person.shift.toLowerCase()}</p>
            <p className="text-xs tabular-nums text-muted-foreground">C.C. {person.cedula}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-paper p-4 text-ink shadow-inner ring-1 ring-border">
          <QRCodeSVG
            value={`FUNDESTEAM:${person.id}:${person.cedula.replace(/\D/g, '')}`}
            size={176}
            fgColor="currentColor"
            bgColor="transparent"
            level="M"
            title={`Código QR del carné de ${person.name}`}
          />
        </div>
        <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground">
          Si no puedes escanear, presenta este código al personal de portería.
        </p>
      </div>
    </Panel>
  )
}

function NextClassCard({ person, onSeeClasses }: { person: Person; onSeeClasses?: () => void }) {
  const now = useNow(15000)
  const today = mondayIndex(now)
  const mine = SCHEDULE.filter((s) => s.group === person.course)
  const todays = today <= 4 ? mine.filter((s) => s.day === today) : []
  const live = todays.find((s) => getSessionStatus(s.day, s.start, s.end, now) === 'live')
  const upcoming = todays.find((s) => getSessionStatus(s.day, s.start, s.end, now) === 'soon')
  const nextDay = today >= 4 ? 0 : today + 1
  const fallback = mine.find((s) => s.day === nextDay)

  const session = live ?? upcoming ?? fallback
  const label = live ? 'Ahora en clase' : upcoming ? 'Tu próxima clase' : `Próxima clase · ${DAYS[nextDay]}`

  if (!session) return null

  return (
    <Panel className={cn('p-5 sm:p-6', live && 'glow-ring')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{label}</p>
          <h2 className="mt-1 text-xl font-semibold">{session.subject}</h2>
        </div>
        {live ? <StatusPill tone="live">En curso</StatusPill> : <StatusPill tone="soon">Próximamente</StatusPill>}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Horario</dt>
          <dd className="font-medium tabular-nums">
            {session.start} – {session.end}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Profesor</dt>
          <dd className="font-medium">{session.teacher}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Salón</dt>
          <dd className="font-medium">{session.room}</dd>
        </div>
      </dl>
      {onSeeClasses && (
        <button type="button" onClick={onSeeClasses} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <BookOpen className="size-4" aria-hidden />
          Ver todas mis clases
        </button>
      )}
    </Panel>
  )
}

function ClassesTab({ person }: { person: Person }) {
  const now = useNow(15000)
  const today = mondayIndex(now)
  const [day, setDay] = useState(today > 4 ? 0 : today)
  const mine = SCHEDULE.filter((s) => s.group === person.course)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <SectionHeader
        eyebrow={`Grupo ${person.course}`}
        title="Mis clases"
        description="Tu horario por bloques. El estado de cada clase se actualiza automáticamente según la hora actual."
        action={
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="live">Clase en curso</StatusPill>
            <StatusPill tone="done">Finalizado</StatusPill>
            <StatusPill tone="soon">Próximamente</StatusPill>
          </div>
        }
      />
      <NextClassCard person={person} />
      <DayView sessions={mine} day={day} setDay={setDay} today={today} now={now} />
    </div>
  )
}
