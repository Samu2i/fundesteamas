'use client'

import { BookOpen, Check, DoorOpen, FilterX, LogOut, Search, Sun, Sunset, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Shift } from '@/lib/attendance-data'
import { formatDuration, formatTime, normalize } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import type { ViewId } from './attendance-app'
import { useAttendance, useNow, type PresenceRecord } from './attendance-store'
import { Avatar, EmptyState, Panel, SectionHeader, Segmented, SelectField, StatusPill, primaryButton, secondaryButton } from './ui'

type ShiftFilter = 'all' | Shift

export function CheckOutView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { inside, checkOut, checkOutCount } = useAttendance()
  const now = useNow(30000)
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [shift, setShift] = useState<ShiftFilter>('all')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  const courses = useMemo(() => Array.from(new Set(inside.map((r) => r.person.course))).sort(), [inside])

  const rows = inside.filter((r) => {
    const q = normalize(query)
    return (
      (course === 'all' || r.person.course === course) &&
      (shift === 'all' || r.person.shift === shift) &&
      (q === '' || normalize(r.person.name).includes(q) || r.person.cedula.replace(/\D/g, '').includes(query.replace(/\D/g, '') || '§'))
    )
  })

  const hasFilters = query !== '' || course !== 'all' || shift !== 'all'
  const clearFilters = () => {
    setQuery('')
    setCourse('all')
    setShift('all')
  }

  const confirm = (id: string) => {
    setConfirmingId(null)
    setLeavingId(id)
    window.setTimeout(() => {
      checkOut(id)
      setLeavingId(null)
    }, 320)
  }

  const rowProps = (r: PresenceRecord) => ({
    record: r,
    now,
    confirming: confirmingId === r.person.id,
    leaving: leavingId === r.person.id,
    onAsk: () => setConfirmingId(r.person.id),
    onCancel: () => setConfirmingId(null),
    onConfirm: () => confirm(r.person.id),
  })

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <SectionHeader
        eyebrow="Módulo 02 · Salida"
        title="Confirmación de salida"
        description="Personas que se encuentran actualmente dentro de la institución. Confirma cada salida para cerrar su registro del día."
        action={
          <div className="flex gap-3">
            <div className="rounded-2xl border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Dentro ahora</p>
              <p className="font-heading text-2xl font-semibold tabular-nums">{inside.length}</p>
            </div>
            <div className="rounded-2xl border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Salidas hoy</p>
              <p className="font-heading text-2xl font-semibold tabular-nums text-success">{checkOutCount}</p>
            </div>
          </div>
        }
      />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-end">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Buscar</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre o cédula"
                className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              />
            </span>
          </label>
          <SelectField
            label="Curso"
            value={course}
            onChange={setCourse}
            icon={BookOpen}
            className="lg:w-52"
            options={[{ value: 'all', label: 'Todos los cursos' }, ...courses.map((c) => ({ value: c, label: c }))]}
          />
          <div className="flex flex-col gap-1.5 lg:w-72">
            <span className="text-xs font-medium text-muted-foreground">Turno</span>
            <Segmented<ShiftFilter>
              label="Turno"
              value={shift}
              onChange={setShift}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Mañana', label: 'Mañana', icon: Sun },
                { value: 'Tarde', label: 'Tarde', icon: Sunset },
              ]}
            />
          </div>
        </div>

        {inside.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="La sede está vacía"
            description="Todas las personas registradas ya confirmaron su salida. Los nuevos ingresos aparecerán aquí automáticamente."
            action={
              <button type="button" onClick={() => onNavigate('ingreso')} className={primaryButton}>
                Registrar un ingreso
              </button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FilterX}
            title="Nadie coincide con los filtros"
            description="Ajusta el curso, el turno o la búsqueda para ver a las personas dentro de la institución."
            action={
              <button type="button" onClick={clearFilters} className={secondaryButton}>
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Persona</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Curso</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Turno</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Ingreso</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tiempo dentro</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">
                      <span className="sr-only">Acción</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <TableRow key={r.person.id} {...rowProps(r)} />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="flex flex-col divide-y md:hidden">
              {rows.map((r) => (
                <MobileRow key={r.person.id} {...rowProps(r)} />
              ))}
            </ul>
          </>
        )}

        {hasFilters && rows.length > 0 && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
            <span>
              Mostrando {rows.length} de {inside.length}
            </span>
            <button type="button" onClick={clearFilters} className="font-semibold text-primary hover:underline">
              Limpiar filtros
            </button>
          </div>
        )}
      </Panel>
    </div>
  )
}

interface RowProps {
  record: PresenceRecord
  now: Date
  confirming: boolean
  leaving: boolean
  onAsk: () => void
  onCancel: () => void
  onConfirm: () => void
}

function ExitAction({ confirming, onAsk, onCancel, onConfirm, name }: Omit<RowProps, 'record' | 'now' | 'leaving'> & { name: string }) {
  if (confirming) {
    return (
      <div className="flex animate-in items-center justify-end gap-2 fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar salida"
          className="flex size-9 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-success-foreground shadow-md shadow-success/30 transition-all hover:-translate-y-0.5"
        >
          <Check className="size-4" aria-hidden />
          Confirmar
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onAsk}
      aria-label={`Registrar salida de ${name}`}
      className="group inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/25"
    >
      <LogOut className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      Registrar salida
    </button>
  )
}

function TableRow({ record, now, leaving, ...actions }: RowProps) {
  const { person } = record
  return (
    <tr
      className={cn(
        'border-t transition-all duration-300 hover:bg-muted/40',
        actions.confirming && 'bg-success/5',
        leaving && 'translate-x-4 opacity-0',
      )}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={person.name} role={person.role} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{person.name}</p>
            <p className="text-xs text-muted-foreground">
              {person.role} · C.C. {person.cedula}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 font-medium">{person.course}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{person.shift}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums">{formatTime(record.entryAt)}</span>
          <StatusPill tone={record.status === 'Puntual' ? 'success' : 'warning'}>{record.status}</StatusPill>
        </div>
      </td>
      <td className="px-4 py-3.5 tabular-nums text-muted-foreground">{formatDuration(now.getTime() - record.entryAt)}</td>
      <td className="px-5 py-3.5 text-right">
        <ExitAction {...actions} name={person.name} />
      </td>
    </tr>
  )
}

function MobileRow({ record, now, leaving, ...actions }: RowProps) {
  const { person } = record
  return (
    <li className={cn('flex flex-col gap-3 p-4 transition-all duration-300', leaving && 'translate-x-4 opacity-0')}>
      <div className="flex items-center gap-3">
        <Avatar name={person.name} role={person.role} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{person.name}</p>
          <p className="text-xs text-muted-foreground">
            {person.course} · {person.shift}
          </p>
        </div>
        <StatusPill tone={record.status === 'Puntual' ? 'success' : 'warning'}>{record.status}</StatusPill>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Ingresó <span className="font-semibold tabular-nums text-foreground">{formatTime(record.entryAt)}</span> ·{' '}
          <span className="tabular-nums">{formatDuration(now.getTime() - record.entryAt)}</span>
        </p>
        <ExitAction {...actions} name={person.name} />
      </div>
    </li>
  )
}
