'use client'

import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  DoorOpen,
  LogIn,
  LogOut,
  QrCode,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { TOTAL_STUDENTS, WEEKLY_FLOW } from '@/lib/attendance-data'
import { formatNumber, formatTime, mondayIndex } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import type { ViewId } from './attendance-app'
import { useAttendance, useNow } from './attendance-store'
import { Avatar, Panel } from './ui'

export function DashboardView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { inside, todayCount } = useAttendance()
  const now = useNow(1000)
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Buenas noches' : hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const punctuality = 94.2

  const stats: { label: string; value: string; hint: string; icon: LucideIcon; tone: 'primary' | 'success' | 'neutral' }[] = [
    { label: 'Total de estudiantes', value: formatNumber(TOTAL_STUDENTS), hint: '+32 este periodo', icon: Users, tone: 'primary' },
    { label: 'Asistencias hoy', value: formatNumber(todayCount), hint: `${Math.round((todayCount / TOTAL_STUDENTS) * 100)}% de la matrícula`, icon: UserCheck, tone: 'success' },
    { label: 'Salidas pendientes', value: formatNumber(inside.length), hint: 'Personas dentro ahora', icon: DoorOpen, tone: 'neutral' },
    { label: 'Puntualidad', value: `${punctuality}%`, hint: '+1,8 pts vs. semana pasada', icon: Timer, tone: 'primary' },
  ]

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/25 sm:p-8 lg:p-10">
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-xl flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold ring-1 ring-primary-foreground/25">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Jornada activa · Sede principal
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {greeting}, equipo Fundesteam
            </h1>
            <p className="text-pretty leading-relaxed text-primary-foreground/80">
              Supervisa ingresos, salidas y horarios de la institución en tiempo real. Todo el flujo de asistencia, en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('ingreso')}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-4 py-2.5 text-sm font-semibold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <QrCode className="size-4" aria-hidden />
                Registrar ingreso
              </button>
              <button
                type="button"
                onClick={() => onNavigate('salida')}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-primary-foreground/40 transition-all hover:-translate-y-0.5 hover:bg-primary-foreground/10"
              >
                Ver personas dentro
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-primary-foreground/10 p-5 ring-1 ring-primary-foreground/20 backdrop-blur-sm lg:min-w-64">
            <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">Hora oficial</p>
            <p className="font-heading text-5xl font-semibold tabular-nums tracking-tight">{formatTime(now)}</p>
            <p className="text-sm tabular-nums text-primary-foreground/75">
              :{now.getSeconds().toString().padStart(2, '0')} s · Tolerancia hasta 07:10
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Estadísticas rápidas" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 70} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <WeeklyChart />
        <RecentActivity />
      </div>

      <section aria-labelledby="shortcuts" className="flex flex-col gap-4">
        <h2 id="shortcuts" className="text-lg font-semibold">
          Accesos directos
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Shortcut
            icon={LogIn}
            title="Registro de ingreso"
            text="Busca por cédula o nombre, o escanea el código QR del carné."
            onClick={() => onNavigate('ingreso')}
          />
          <Shortcut
            icon={LogOut}
            title="Confirmación de salida"
            text="Revisa quién sigue en la sede y confirma salidas en un clic."
            onClick={() => onNavigate('salida')}
          />
          <Shortcut
            icon={CalendarClock}
            title="Consulta de horarios"
            text="Clases en curso, bloques del día y filtros por docente o grupo."
            onClick={() => onNavigate('horarios')}
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  delay,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: 'primary' | 'success' | 'neutral'
  delay: number
}) {
  return (
    <Panel className="card-glow animate-rise p-4 hover:-translate-y-0.5 sm:p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10',
            tone === 'primary' && 'bg-primary/10 text-primary',
            tone === 'success' && 'bg-success/15 text-success',
            tone === 'neutral' && 'bg-foreground/[0.07] text-foreground',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="size-3.5 text-success" aria-hidden />
        {hint}
      </p>
    </Panel>
  )
}

function WeeklyChart() {
  const today = mondayIndex(new Date())
  const max = TOTAL_STUDENTS
  const avg = Math.round(WEEKLY_FLOW.reduce((s, d) => s + d.total, 0) / WEEKLY_FLOW.length)
  const best = WEEKLY_FLOW.reduce((a, b) => (b.total > a.total ? b : a))

  return (
    <Panel className="p-5 sm:p-6 lg:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Flujo de asistencia semanal</h2>
          <p className="text-sm text-muted-foreground">Ingresos totales frente a ingresos puntuales</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-success" aria-hidden />
            Puntuales
          </span>
        </div>
      </div>

      <div className="relative mt-6 h-60" role="img" aria-label={`Gráfico semanal. Promedio diario ${formatNumber(avg)} ingresos.`}>
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
          {[1, 0.75, 0.5, 0.25, 0].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{formatNumber(Math.round(max * t))}</span>
              <span className="h-px flex-1 border-t border-dashed" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-14 right-0 flex items-end justify-around pb-2">
          {WEEKLY_FLOW.map((d, i) => (
            <div key={d.day} className="group relative flex h-full flex-col items-center justify-end">
              <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-lg border bg-popover px-3 py-2 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <p className="font-semibold">{d.day}</p>
                <p className="whitespace-nowrap text-muted-foreground">{formatNumber(d.total)} ingresos</p>
                <p className="whitespace-nowrap text-success">{formatNumber(d.onTime)} puntuales</p>
              </div>
              <div className="flex h-full items-end gap-1.5">
                <div
                  className={cn(
                    'animate-grow w-4 rounded-t-md bg-primary transition-all group-hover:brightness-110 sm:w-6',
                    i !== today && 'opacity-80',
                  )}
                  style={{ height: `${(d.total / max) * 100}%`, animationDelay: `${i * 80}ms` }}
                />
                <div
                  className="animate-grow w-4 rounded-t-md bg-success transition-all group-hover:brightness-110 sm:w-6"
                  style={{ height: `${(d.onTime / max) * 100}%`, animationDelay: `${i * 80 + 60}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="ml-14 flex justify-around pt-2" aria-hidden>
        {WEEKLY_FLOW.map((d, i) => (
          <span
            key={d.day}
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-medium',
              i === today ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
            )}
          >
            {d.day}
          </span>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t pt-5">
        <div>
          <dt className="text-xs text-muted-foreground">Promedio diario</dt>
          <dd className="font-heading text-lg font-semibold tabular-nums">{formatNumber(avg)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Mejor día</dt>
          <dd className="font-heading text-lg font-semibold">
            {best.day} · <span className="tabular-nums">{formatNumber(best.total)}</span>
          </dd>
        </div>
      </dl>
    </Panel>
  )
}

function RecentActivity() {
  const { activity } = useAttendance()
  const recent = activity.slice(0, 6)
  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Actividad reciente</h2>
        <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">En vivo</span>
      </div>
      <ul className="mt-4 flex flex-col">
        {recent.map((e) => (
          <li key={e.id} className="flex items-center gap-3 border-b py-3 last:border-b-0">
            <Avatar name={e.person.name} role={e.person.role} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.person.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.kind === 'in' ? 'Ingreso' : 'Salida'} · {e.person.course}
                {e.method ? ` · ${e.method}` : ''}
              </p>
            </div>
            <span
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold tabular-nums',
                e.kind === 'in' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
              )}
            >
              {e.kind === 'in' ? <LogIn className="size-3" aria-hidden /> : <LogOut className="size-3" aria-hidden />}
              {formatTime(e.at)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Shortcut({ icon: Icon, title, text, onClick }: { icon: LucideIcon; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-glow group flex flex-col items-start gap-4 rounded-2xl border bg-card p-5 text-left hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <ArrowUpRight
          className="size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </button>
  )
}
