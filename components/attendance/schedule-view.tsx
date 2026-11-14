'use client'

import { BookOpen, CalendarDays, Coffee, FilterX, LayoutList, MapPin, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import { BLOCKS, DAYS, GROUPS, SCHEDULE, SUBJECT_NAMES, TEACHERS, type ClassSession } from '@/lib/attendance-data'
import { getSessionStatus, mondayIndex, sessionProgress, type SessionStatus } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import { useNow } from './attendance-store'
import { EmptyState, Panel, SectionHeader, Segmented, SelectField, StatusPill, secondaryButton } from './ui'

const STATUS_LABEL: Record<SessionStatus, string> = {
  live: 'Clase en curso',
  done: 'Finalizado',
  soon: 'Próximamente',
}

type Mode = 'day' | 'week'

export function ScheduleView() {
  const now = useNow(15000)
  const today = mondayIndex(now)
  const [day, setDay] = useState(today > 4 ? 0 : today)
  const [mode, setMode] = useState<Mode>('day')
  const [teacher, setTeacher] = useState('all')
  const [subject, setSubject] = useState('all')
  const [group, setGroup] = useState('10°A')

  const filtered = SCHEDULE.filter(
    (s) =>
      (teacher === 'all' || s.teacher === teacher) &&
      (subject === 'all' || s.subject === subject) &&
      (group === 'all' || s.group === group),
  )
  const hasFilters = teacher !== 'all' || subject !== 'all' || group !== 'all'
  const clearFilters = () => {
    setTeacher('all')
    setSubject('all')
    setGroup('all')
  }

  const liveCount = filtered.filter((s) => getSessionStatus(s.day, s.start, s.end, now) === 'live').length

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <SectionHeader
        eyebrow="Módulo 03 · Horarios"
        title="Consulta de horarios"
        description="Bloques de clase organizados por hora. El estado de cada sesión se actualiza automáticamente según la hora actual."
        action={
          <div className="w-full sm:w-64">
            <Segmented<Mode>
              label="Vista"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'day', label: 'Diaria', icon: LayoutList },
                { value: 'week', label: 'Semanal', icon: CalendarDays },
              ]}
            />
          </div>
        }
      />

      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Profesor"
            value={teacher}
            onChange={setTeacher}
            icon={UserRound}
            options={[{ value: 'all', label: 'Todos los profesores' }, ...TEACHERS.map((t) => ({ value: t, label: t }))]}
          />
          <SelectField
            label="Materia"
            value={subject}
            onChange={setSubject}
            icon={BookOpen}
            options={[{ value: 'all', label: 'Todas las materias' }, ...SUBJECT_NAMES.map((t) => ({ value: t, label: t }))]}
          />
          <SelectField
            label="Grupo"
            value={group}
            onChange={setGroup}
            icon={Users}
            options={[{ value: 'all', label: 'Todos los grupos' }, ...GROUPS.map((g) => ({ value: g, label: `Grupo ${g}` }))]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="live">{STATUS_LABEL.live}</StatusPill>
            <StatusPill tone="done">{STATUS_LABEL.done}</StatusPill>
            <StatusPill tone="soon">{STATUS_LABEL.soon}</StatusPill>
          </div>
          <p className="text-xs text-muted-foreground">
            {liveCount > 0 ? `${liveCount} clase${liveCount > 1 ? 's' : ''} en curso ahora` : 'Sin clases en curso en este momento'}
            {hasFilters && (
              <>
                {' · '}
                <button type="button" onClick={clearFilters} className="font-semibold text-primary hover:underline">
                  Limpiar filtros
                </button>
              </>
            )}
          </p>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FilterX}
            title="No hay clases con esos filtros"
            description="Esta combinación de profesor, materia y grupo no tiene sesiones programadas. Prueba ampliar la búsqueda."
            action={
              <button type="button" onClick={clearFilters} className={secondaryButton}>
                Ver todos los horarios
              </button>
            }
          />
        </Panel>
      ) : mode === 'day' ? (
        <DayView sessions={filtered} day={day} setDay={setDay} today={today} now={now} />
      ) : (
        <WeekView sessions={filtered} today={today} now={now} />
      )}
    </div>
  )
}

function DayTabs({ day, setDay, today }: { day: number; setDay: (d: number) => void; today: number }) {
  return (
    <div role="tablist" aria-label="Día" className="flex gap-2 overflow-x-auto pb-1">
      {DAYS.map((d, i) => {
        const active = i === day
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setDay(i)}
            className={cn(
              'relative flex min-w-24 flex-1 flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 transition-all',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-card hover:-translate-y-0.5 hover:border-primary/40',
            )}
          >
            <span className="text-sm font-semibold">{d}</span>
            <span className={cn('text-xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
              {i === today ? 'Hoy' : i < today && today <= 4 ? 'Pasado' : 'Próximo'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function DayView({
  sessions,
  day,
  setDay,
  today,
  now,
}: {
  sessions: ClassSession[]
  day: number
  setDay: (d: number) => void
  today: number
  now: Date
}) {
  const daySessions = sessions.filter((s) => s.day === day)

  return (
    <div className="flex flex-col gap-5">
      <DayTabs day={day} setDay={setDay} today={today} />
      {daySessions.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarDays}
            title={`Sin clases el ${DAYS[day].toLowerCase()}`}
            description="Con los filtros actuales no hay sesiones programadas este día. Revisa otro día de la semana."
          />
        </Panel>
      ) : (
        <ol className="flex flex-col gap-3">
          {BLOCKS.map((block) => {
            if (block.isBreak) {
              return (
                <li key={block.id} className="flex items-center gap-4">
                  <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground sm:w-20">
                    {block.start}
                  </span>
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
                    <Coffee className="size-4" aria-hidden />
                    Descanso · {block.start} – {block.end}
                  </div>
                </li>
              )
            }
            const items = daySessions.filter((s) => s.blockId === block.id)
            if (items.length === 0) return null
            return (
              <li key={block.id} className="flex gap-4">
                <div className="flex w-16 shrink-0 flex-col items-end pt-4 sm:w-20">
                  <span className="font-heading text-sm font-semibold tabular-nums">{block.start}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{block.end}</span>
                </div>
                <div className="grid flex-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                  {items.map((s) => (
                    <SessionCard key={s.id} session={s} now={now} />
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function SessionCard({ session, now }: { session: ClassSession; now: Date }) {
  const status = getSessionStatus(session.day, session.start, session.end, now)
  const progress = status === 'live' ? sessionProgress(session.start, session.end, now) : 0
  return (
    <article
      className={cn(
        'card-glow flex flex-col gap-3 rounded-2xl border bg-card p-4',
        status === 'live' && 'glow-ring',
        status === 'done' && 'opacity-70 hover:opacity-100',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{session.subject}</h3>
          <p className="text-sm text-muted-foreground">{session.teacher}</p>
        </div>
        <StatusPill tone={status}>{STATUS_LABEL[status]}</StatusPill>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          Grupo {session.group}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          {session.room}
        </span>
      </div>
      {status === 'live' && (
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Progreso de la clase"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-success">{Math.round(progress * 100)}%</span>
        </div>
      )}
    </article>
  )
}

const CHIP_TONES: Record<SessionStatus, string> = {
  live: 'glow-ring bg-success/10',
  done: 'bg-muted/60 text-muted-foreground',
  soon: 'bg-primary/5 border-primary/20',
}

function WeekView({ sessions, today, now }: { sessions: ClassSession[]; today: number; now: Date }) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
          <caption className="sr-only">Horario semanal por bloques</caption>
          <thead>
            <tr className="bg-muted/50">
              <th scope="col" className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bloque
              </th>
              {DAYS.map((d, i) => (
                <th
                  key={d}
                  scope="col"
                  className={cn('px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider', i === today ? 'text-primary' : 'text-muted-foreground')}
                >
                  <span className="flex items-center gap-2">
                    {d}
                    {i === today && <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] normal-case tracking-normal text-primary-foreground">Hoy</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((block) =>
              block.isBreak ? (
                <tr key={block.id} className="border-t">
                  <th scope="row" className="px-4 py-2 text-left text-xs font-medium tabular-nums text-muted-foreground">
                    {block.start}
                  </th>
                  <td colSpan={5} className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-1.5 text-xs text-muted-foreground">
                      <Coffee className="size-3.5" aria-hidden />
                      Descanso
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={block.id} className="border-t align-top">
                  <th scope="row" className="px-4 py-3 text-left">
                    <span className="block font-heading text-sm font-semibold tabular-nums">{block.start}</span>
                    <span className="block text-xs font-normal tabular-nums text-muted-foreground">{block.end}</span>
                  </th>
                  {DAYS.map((d, dayIdx) => {
                    const items = sessions.filter((s) => s.day === dayIdx && s.blockId === block.id)
                    return (
                      <td key={d} className={cn('px-2 py-2', dayIdx === today && 'bg-primary/[0.03]')}>
                        <div className="flex flex-col gap-1.5">
                          {items.map((s) => {
                            const status = getSessionStatus(s.day, s.start, s.end, now)
                            return (
                              <div
                                key={s.id}
                                title={`${s.subject} · ${s.teacher} · ${s.room} · ${STATUS_LABEL[status]}`}
                                className={cn('card-glow rounded-lg border p-2.5', CHIP_TONES[status])}
                              >
                                <p className="flex items-center gap-1.5 truncate text-xs font-semibold">
                                  {status === 'live' && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-success" aria-hidden />}
                                  {s.subject}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {s.group} · {s.teacher.split(' ')[0]}
                                </p>
                                <span className="sr-only">{STATUS_LABEL[status]}</span>
                              </div>
                            )
                          })}
                          {items.length === 0 && <span className="block py-3 text-center text-xs text-muted-foreground/60">—</span>}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
