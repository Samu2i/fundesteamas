'use client'

import {
  BadgeCheck,
  Briefcase,
  CircleCheck,
  Clock,
  GraduationCap,
  LogIn,
  QrCode,
  Search,
  SearchX,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { DIRECTORY, type Person, type Role } from '@/lib/attendance-data'
import { formatLongDate, formatTime, normalize } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import { useAttendance, type CheckMethod, type PresenceRecord } from './attendance-store'
import { QrScannerDialog } from './qr-scanner'
import { Avatar, EmptyState, Panel, SectionHeader, Segmented, StatusPill, primaryButton, secondaryButton } from './ui'

const ROLE_OPTIONS: { value: Role; label: string; icon: typeof GraduationCap }[] = [
  { value: 'Estudiante', label: 'Estudiante', icon: GraduationCap },
  { value: 'Profesor', label: 'Profesor', icon: Briefcase },
  { value: 'Administrador', label: 'Admin', icon: ShieldCheck },
]

export function CheckInView() {
  const { inside, activity, checkIn, notify } = useAttendance()
  const [role, setRole] = useState<Role>('Estudiante')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [last, setLast] = useState<{ record: PresenceRecord; duplicate: boolean } | null>(null)
  const [scanning, setScanning] = useState(false)

  const insideIds = useMemo(() => new Set(inside.map((r) => r.person.id)), [inside])

  const results = useMemo(() => {
    const q = normalize(query)
    const digits = query.replace(/\D/g, '')
    return DIRECTORY.filter(
      (p) =>
        p.role === role &&
        (normalize(p.name).includes(q) || (digits.length > 0 && p.cedula.replace(/\D/g, '').includes(digits))),
    )
  }, [role, query])

  const selected = DIRECTORY.find((p) => p.id === selectedId) ?? null

  const register = (person: Person, method: CheckMethod) => {
    const result = checkIn(person, method)
    setLast({ record: result.record, duplicate: !result.ok })
    setSelectedId(null)
    setQuery('')
  }

  const startScan = () => setScanning(true)

  const finishScan = () => {
    setScanning(false)
    const candidates = DIRECTORY.filter((p) => p.role === role && !insideIds.has(p.id))
    if (candidates.length === 0) {
      notify({ tone: 'info', title: 'Sin códigos pendientes', description: `Todo el personal de ${role.toLowerCase()} ya registró ingreso.` })
      return
    }
    register(candidates[Math.floor(Math.random() * candidates.length)], 'QR')
  }

  const recentIns = activity.filter((e) => e.kind === 'in').slice(0, 4)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <SectionHeader
        eyebrow="Módulo 01 · Ingreso"
        title="Registro de ingreso"
        description="Selecciona el rol, busca a la persona por cédula o nombre, o escanea el código QR de su carné institucional."
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Panel className="flex flex-col gap-6 p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">1. Rol de la persona</p>
            <Segmented
              label="Rol"
              value={role}
              onChange={(r) => {
                setRole(r)
                setSelectedId(null)
              }}
              options={ROLE_OPTIONS}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="person-search" className="text-sm font-semibold">
              2. Buscar por cédula o nombre
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  id="person-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej. 1.023.456 o Isabella"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                />
              </div>
              <button type="button" onClick={startScan} className={cn(secondaryButton, 'h-12')}>
                <QrCode className="size-4" aria-hidden />
                Escanear QR
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">3. Selecciona a la persona</p>
              <span className="text-xs text-muted-foreground">{results.length} resultados</span>
            </div>
            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed">
                <EmptyState
                  icon={SearchX}
                  title="Sin coincidencias"
                  description={`No encontramos ningún ${role.toLowerCase()} con “${query}”. Revisa la cédula o prueba con otro nombre.`}
                  className="py-8"
                  action={
                    <button type="button" onClick={() => setQuery('')} className={secondaryButton}>
                      Limpiar búsqueda
                    </button>
                  }
                />
              </div>
            ) : (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1" aria-label="Resultados">
                {results.map((p) => {
                  const isSelected = p.id === selectedId
                  const isInside = insideIds.has(p.id)
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedId(isSelected ? null : p.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                            : 'bg-background hover:border-primary/40 hover:bg-muted/50',
                        )}
                      >
                        <Avatar name={p.name} role={p.role} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{p.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            C.C. {p.cedula} · {p.course} · {p.shift}
                          </p>
                        </div>
                        {isInside ? (
                          <StatusPill tone="success">Dentro</StatusPill>
                        ) : (
                          <span
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                              isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                            )}
                            aria-hidden
                          >
                            {isSelected && <CircleCheck className="size-3" />}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && register(selected, 'Manual')}
            className={cn(primaryButton, 'h-12 w-full text-base')}
          >
            <LogIn className="size-5" aria-hidden />
            {selected ? `Registrar ingreso de ${selected.name.split(' ')[0]}` : 'Selecciona una persona'}
          </button>
        </Panel>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-2">
          <ConfirmationCard last={last} />

          <Panel className="p-5">
            <h2 className="text-sm font-semibold">Últimos ingresos</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {recentIns.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={e.person.name} role={e.person.role} size="sm" />
                  <p className="min-w-0 flex-1 truncate text-sm">{e.person.name}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">{formatTime(e.at)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {scanning && (
        <QrScannerDialog
          hint={`Acerca el carné de ${role.toLowerCase()} a la cámara del dispositivo.`}
          onCancel={() => setScanning(false)}
          onDetected={finishScan}
        />
      )}
    </div>
  )
}

function ConfirmationCard({ last }: { last: { record: PresenceRecord; duplicate: boolean } | null }) {
  if (!last) {
    return (
      <Panel className="border-dashed">
        <EmptyState
          icon={UserRound}
          title="Esperando registro"
          description="Cuando registres un ingreso, aquí verás la confirmación con los datos y la hora exacta de entrada."
        />
      </Panel>
    )
  }

  const { record, duplicate } = last
  const { person } = record
  return (
    <Panel key={record.entryAt + person.id} className={cn('animate-rise overflow-hidden', duplicate ? 'border-destructive/40' : 'glow-ring')}>
      <div className={cn('flex items-center gap-3 px-5 py-4', duplicate ? 'bg-destructive/10' : 'bg-success/10')}>
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-full',
            duplicate ? 'bg-destructive/15 text-destructive' : 'bg-success text-success-foreground',
          )}
        >
          <BadgeCheck className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-heading font-semibold">{duplicate ? 'Ingreso ya registrado' : 'Ingreso confirmado'}</p>
          <p className="text-xs text-muted-foreground">
            {duplicate ? 'Esta persona ya se encuentra en la sede' : `Vía ${record.method === 'QR' ? 'código QR' : 'registro manual'}`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={person.name} role={person.role} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{person.name}</p>
            <p className="text-sm text-muted-foreground">{person.role}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-muted/70 p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            Hora de entrada
          </p>
          <p className="mt-1 font-heading text-4xl font-semibold tabular-nums tracking-tight">{formatTime(record.entryAt, true)}</p>
          <p className="mt-1 text-xs text-muted-foreground first-letter:uppercase">{formatLongDate(record.entryAt)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Cédula" value={person.cedula} />
          <Detail label="Curso / área" value={person.course} />
          <Detail label="Turno" value={person.shift} />
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd>
              <StatusPill tone={record.status === 'Puntual' ? 'success' : 'warning'}>{record.status}</StatusPill>
            </dd>
          </div>
        </dl>
      </div>
    </Panel>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
