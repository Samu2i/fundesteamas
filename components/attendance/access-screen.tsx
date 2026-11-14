'use client'

import { ArrowRight, CalendarClock, CircleAlert, GraduationCap, IdCard, Moon, QrCode, ShieldCheck, Sun } from 'lucide-react'
import { useState } from 'react'
import { DIRECTORY, type Person } from '@/lib/attendance-data'
import { cn } from '@/lib/utils'
import { Avatar, Segmented, primaryButton } from './ui'

export type Portal = 'student' | 'admin'
export interface Session {
  portal: Portal
  person: Person
}

const DEMO_ACCOUNTS: Record<Portal, string[]> = {
  student: ['e01', 'e04', 'e10'],
  admin: ['a01', 'a02'],
}

const digits = (value: string) => value.replace(/\D/g, '')

export function AccessScreen({
  onEnter,
  dark,
  onToggleTheme,
}: {
  onEnter: (session: Session) => void
  dark: boolean
  onToggleTheme: () => void
}) {
  const [portal, setPortal] = useState<Portal>('student')
  const [cedula, setCedula] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const person = DIRECTORY.find((p) => digits(p.cedula) === digits(cedula))
    if (!person) {
      setError('No encontramos esa cédula en el directorio institucional.')
      return
    }
    if (portal === 'admin' && person.role !== 'Administrador') {
      setError('Esta cédula no tiene permisos de administración.')
      return
    }
    if (portal === 'student' && person.role !== 'Estudiante') {
      setError('Esta cédula no pertenece a un estudiante. Usa el portal de administración.')
      return
    }
    onEnter({ portal, person })
  }

  const demo = DEMO_ACCOUNTS[portal].map((id) => DIRECTORY.find((p) => p.id === id)!)

  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      <section className="relative overflow-hidden bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:justify-between md:py-12">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground text-primary shadow-lg">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-lg font-bold">Fundesteam</p>
              <p className="text-xs text-primary-foreground/75">Control de asistencia institucional</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="flex size-10 items-center justify-center rounded-xl ring-1 ring-primary-foreground/30 transition-all hover:-translate-y-0.5 hover:bg-primary-foreground/10"
          >
            {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          </button>
        </div>

        <div className="relative mt-10 flex max-w-lg flex-col gap-5 md:mt-0">
          <h1 className="text-balance text-4xl font-semibold tracking-tight lg:text-5xl">Tu asistencia, en un solo escaneo.</h1>
          <p className="text-pretty leading-relaxed text-primary-foreground/80">
            Los estudiantes registran su ingreso con el código QR de portería y consultan sus clases. La administración supervisa toda la sede en tiempo real.
          </p>
          <ul className="hidden flex-col gap-3 pt-2 sm:flex">
            {[
              { icon: QrCode, text: 'Ingreso y salida con código QR' },
              { icon: CalendarClock, text: 'Horario del día con clases en curso' },
              { icon: ShieldCheck, text: 'Panel de control exclusivo para administradores' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 hidden text-xs text-primary-foreground/60 md:block">Sede principal · Bogotá</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <form onSubmit={submit} className="flex w-full max-w-md animate-rise flex-col gap-6" noValidate>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Ingresa al sistema</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Elige tu portal e identifícate con tu número de cédula.</p>
          </div>

          <Segmented<Portal>
            label="Portal"
            value={portal}
            onChange={(p) => {
              setPortal(p)
              setError(null)
              setCedula('')
            }}
            options={[
              { value: 'student', label: 'Estudiante', icon: GraduationCap },
              { value: 'admin', label: 'Administración', icon: ShieldCheck },
            ]}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="cedula" className="text-sm font-semibold">
              Número de cédula
            </label>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="cedula"
                inputMode="numeric"
                autoComplete="off"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value)
                  setError(null)
                }}
                placeholder="Ej. 1.023.456.781"
                aria-invalid={!!error}
                aria-describedby={error ? 'cedula-error' : undefined}
                className={cn(
                  'h-12 w-full rounded-xl border bg-card pl-10 pr-4 text-sm tabular-nums transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
                  error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15',
                )}
              />
            </div>
            {error && (
              <p id="cedula-error" role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}
          </div>

          <button type="submit" disabled={digits(cedula).length < 6} className={cn(primaryButton, 'h-12 text-base')}>
            {portal === 'student' ? 'Entrar al portal estudiantil' : 'Entrar al panel administrativo'}
            <ArrowRight className="size-4" aria-hidden />
          </button>

          <div className="rounded-2xl border border-dashed p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cuentas de demostración</p>
            <ul className="mt-3 flex flex-col gap-2">
              {demo.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onEnter({ portal, person: p })}
                    className="card-glow flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left"
                  >
                    <Avatar name={p.name} role={p.role} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="block text-xs tabular-nums text-muted-foreground">
                        C.C. {p.cedula} · {p.course}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </section>
    </div>
  )
}
