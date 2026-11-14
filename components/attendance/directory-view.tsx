'use client'

import { Database, Search, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ROLES, type Person, type Role } from '@/lib/attendance-data'
import { normalize } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'
import { useAttendance } from './attendance-store'
import { RegisterForm } from './register-form'
import { Avatar, EmptyState, Panel, SectionHeader } from './ui'

export function DirectoryView({ admin }: { admin: Person }) {
  const { people, inside, loading, refresh, notify } = useAttendance()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | 'Todos'>('Todos')

  const insideIds = useMemo(() => new Set(inside.map((r) => r.person.id)), [inside])
  const counts = useMemo(() => {
    const map: Record<string, number> = { Todos: people.length }
    for (const r of ROLES) map[r] = people.filter((p) => p.role === r).length
    return map
  }, [people])

  const results = useMemo(() => {
    const q = normalize(query)
    const digits = query.replace(/\D/g, '')
    return people.filter(
      (p) =>
        (role === 'Todos' || p.role === role) &&
        (normalize(p.name).includes(q) || (digits.length > 0 && p.cedula.replace(/\D/g, '').includes(digits))),
    )
  }, [people, query, role])

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <SectionHeader
        eyebrow="Módulo 05 · Directorio"
        title="Personas registradas"
        description="Consulta todas las personas guardadas en la base de datos y registra nuevos estudiantes, profesores o administradores."
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Panel className="flex flex-col gap-5 p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="size-4 text-primary" aria-hidden />
            <span>
              <strong className="font-semibold text-foreground tabular-nums">{people.length}</strong> personas en la base de datos
            </span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="directory-search" className="sr-only">
              Buscar por nombre o cédula
            </label>
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o cédula"
              autoComplete="off"
              className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rol">
            {(['Todos', ...ROLES] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  role === r ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {r} <span className="tabular-nums opacity-75">{counts[r] ?? 0}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <ul className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </ul>
          ) : results.length === 0 ? (
            <EmptyState icon={SearchX} title="Sin resultados" description="Prueba con otro nombre, cédula o rol." />
          ) : (
            <ul className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto pr-1">
              {results.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <Avatar name={p.name} role={p.role} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      C.C. {p.cedula} · {p.course} · {p.shift}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                      insideIds.has(p.id) ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {insideIds.has(p.id) ? 'Dentro' : 'Fuera'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="flex flex-col gap-5 p-5 sm:p-6 lg:col-span-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Hoja de registro</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Los datos se guardan al instante en la base de datos.</p>
          </div>
          <RegisterForm
            adminId={admin.id}
            onRegistered={(person) => {
              notify({ tone: 'success', title: 'Persona registrada', description: `${person.name} · ${person.role}` })
              refresh()
            }}
          />
        </Panel>
      </div>
    </div>
  )
}
