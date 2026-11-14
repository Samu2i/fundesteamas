import { ChevronDown, type LucideIcon } from 'lucide-react'
import type { Role } from '@/lib/attendance-data'
import { initials } from '@/lib/attendance-format'
import { cn } from '@/lib/utils'

export function Panel({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-2xl border bg-card text-card-foreground shadow-sm shadow-foreground/[0.03]', className)}
      {...props}
    />
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  )
}

const PILL_TONES = {
  live: 'bg-success/15 text-success ring-success/25',
  done: 'bg-muted text-muted-foreground ring-border',
  soon: 'bg-primary/10 text-primary ring-primary/20',
  success: 'bg-success/15 text-success ring-success/25',
  warning: 'bg-destructive/10 text-destructive ring-destructive/20',
} as const

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof PILL_TONES
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        PILL_TONES[tone],
        className,
      )}
    >
      {tone === 'live' ? (
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
      ) : (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  )
}

const AVATAR_TONES: Record<Role, string> = {
  Estudiante: 'bg-primary/12 text-primary',
  Profesor: 'bg-success/15 text-success',
  Administrador: 'bg-foreground/10 text-foreground',
}

export function Avatar({ name, role, size = 'md' }: { name: string; role: Role; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl font-heading font-semibold',
        AVATAR_TONES[role],
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-16 rounded-2xl text-xl',
      )}
    >
      {initials(name)}
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="flex size-24 items-center justify-center rounded-full border border-dashed border-primary/30">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
          <Icon className="size-7 text-primary" aria-hidden />
        </div>
      </div>
      <h3 className="mt-5 text-balance text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  icon?: LucideIcon
  className?: string
}) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 w-full cursor-pointer appearance-none rounded-xl border bg-background pr-9 text-sm font-medium transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
            Icon ? 'pl-9' : 'pl-3',
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </span>
    </label>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon?: LucideIcon }[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl border bg-muted/60 p-1">
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            {Icon && <Icon className={cn('size-4', active && 'text-primary')} aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25'

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20'
