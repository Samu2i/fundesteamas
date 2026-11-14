'use client'

import { Briefcase, CircleAlert, GraduationCap, Loader2, ShieldCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { registerPerson, type RegisterInput } from '@/app/actions/attendance'
import { GROUPS, type Person, type Role, type Shift } from '@/lib/attendance-data'
import { cn } from '@/lib/utils'
import { Segmented, primaryButton } from './ui'

const inputClass =
  'h-11 w-full rounded-xl border bg-card px-3.5 text-sm transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-destructive'

const ROLE_OPTIONS: { value: Role; label: string; icon: typeof GraduationCap }[] = [
  { value: 'Estudiante', label: 'Estudiante', icon: GraduationCap },
  { value: 'Profesor', label: 'Profesor', icon: Briefcase },
  { value: 'Administrador', label: 'Admin', icon: ShieldCheck },
]

export function RegisterForm({
  adminId,
  onRegistered,
  submitLabel = 'Crear registro',
}: {
  adminId?: string
  onRegistered: (person: Person) => void
  submitLabel?: string
}) {
  const [role, setRole] = useState<Role>('Estudiante')
  const [shift, setShift] = useState<Shift>('Mañana')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<{ message: string; field?: keyof RegisterInput } | null>(null)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    setPending(true)
    setError(null)
    try {
      const res = await registerPerson(
        {
          name: String(data.get('name') ?? ''),
          cedula: String(data.get('cedula') ?? ''),
          role,
          course: String(data.get('course') ?? ''),
          shift,
          email: String(data.get('email') ?? ''),
          phone: String(data.get('phone') ?? ''),
        },
        adminId,
      )
      if (res.ok) {
        form.reset()
        setRole('Estudiante')
        onRegistered(res.person)
      } else {
        setError({ message: res.error, field: res.field })
      }
    } catch {
      setError({ message: 'No pudimos conectar con la base de datos. Intenta de nuevo.' })
    } finally {
      setPending(false)
    }
  }

  const invalid = (field: keyof RegisterInput) => error?.field === field || undefined

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {adminId && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Rol</p>
          <Segmented label="Rol" value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-name" className="text-sm font-semibold">
          Nombre completo
        </label>
        <input id="reg-name" name="name" required autoComplete="name" placeholder="Ej. Juliana Restrepo" aria-invalid={invalid('name')} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-cedula" className="text-sm font-semibold">
          Número de cédula o documento
        </label>
        <input
          id="reg-cedula"
          name="cedula"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej. 1027654321"
          aria-invalid={invalid('cedula')}
          className={cn(inputClass, 'tabular-nums')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {role === 'Estudiante' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-course" className="text-sm font-semibold">
              Curso
            </label>
            <select id="reg-course" name="course" required defaultValue="" aria-invalid={invalid('course')} className={inputClass}>
              <option value="" disabled>
                Selecciona tu curso
              </option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={cn('flex flex-col gap-1.5', role !== 'Estudiante' && 'sm:col-span-2')}>
          <p className="text-sm font-semibold">Jornada</p>
          <Segmented<Shift>
            label="Jornada"
            value={shift}
            onChange={setShift}
            options={[
              { value: 'Mañana', label: 'Mañana' },
              { value: 'Tarde', label: 'Tarde' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-sm font-semibold">
            Correo <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input id="reg-email" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" aria-invalid={invalid('email')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-phone" className="text-sm font-semibold">
            Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input id="reg-phone" name="phone" type="tel" autoComplete="tel" placeholder="300 123 4567" aria-invalid={invalid('phone')} className={inputClass} />
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={cn(primaryButton, 'h-12 text-base')}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
        {pending ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
