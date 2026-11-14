'use server'

import { and, asc, eq, gte, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { attendance, people } from '@/lib/db/schema'
import { GROUPS, ROLES, formatCedula, type Person, type Role, type Shift } from '@/lib/attendance-data'

export type CheckMethod = 'Manual' | 'QR'
export type Punctuality = 'Puntual' | 'Tardío'

export interface PresenceRecord {
  person: Person
  entryAt: number
  status: Punctuality
  method: CheckMethod
}

export interface ActivityEvent {
  id: string
  kind: 'in' | 'out'
  person: Person
  at: number
  method?: CheckMethod
}

export interface DayFlow {
  day: string
  total: number
  onTime: number
}

export interface Snapshot {
  people: Person[]
  inside: PresenceRecord[]
  activity: ActivityEvent[]
  todayCount: number
  checkOutCount: number
  weekly: DayFlow[]
  totalStudents: number
  punctuality: number
}

const TZ = 'America/Bogota'
const startOfToday = sql`(date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`
const WEEKDAY: Record<string, string> = { Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom' }

type PersonRow = typeof people.$inferSelect

function toPerson(row: PersonRow): Person {
  return {
    id: String(row.id),
    cedula: formatCedula(row.cedula),
    name: row.name,
    role: row.role as Role,
    course: row.course,
    shift: row.shift as Shift,
  }
}

function bogotaMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return (get('hour') % 24) * 60 + get('minute')
}

function punctualityFor(shift: string, at: Date): Punctuality {
  const shiftStart = shift === 'Mañana' ? 7 * 60 : 13 * 60
  return bogotaMinutes(at) <= shiftStart + 10 ? 'Puntual' : 'Tardío'
}

function parseId(id: string) {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function getSnapshot(): Promise<Snapshot> {
  const [peopleRows, todayRows, recentRows] = await Promise.all([
    db.select().from(people).orderBy(asc(people.name)),
    db.select().from(attendance).where(gte(attendance.entryAt, startOfToday)),
    db
      .select({ entryAt: attendance.entryAt, status: attendance.status })
      .from(attendance)
      .where(gte(attendance.entryAt, sql`${startOfToday} - interval '14 days'`)),
  ])

  const byId = new Map(peopleRows.map((row) => [row.id, toPerson(row)]))

  const inside: PresenceRecord[] = []
  const activity: ActivityEvent[] = []
  let checkOutCount = 0

  for (const row of todayRows) {
    const person = byId.get(row.personId)
    if (!person) continue
    const method = row.method as CheckMethod
    activity.push({ id: `in-${row.id}`, kind: 'in', person, at: row.entryAt.getTime(), method })
    if (row.exitAt) {
      checkOutCount++
      activity.push({ id: `out-${row.id}`, kind: 'out', person, at: row.exitAt.getTime() })
    } else {
      inside.push({ person, entryAt: row.entryAt.getTime(), status: row.status as Punctuality, method })
    }
  }

  inside.sort((a, b) => b.entryAt - a.entryAt)
  activity.sort((a, b) => b.at - a.at)

  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' })
  const buckets = new Map<string, DayFlow>()
  for (const row of recentRows) {
    const key = dayKey.format(row.entryAt)
    const bucket = buckets.get(key) ?? { day: WEEKDAY[dayName.format(row.entryAt)] ?? '', total: 0, onTime: 0 }
    bucket.total++
    if (row.status === 'Puntual') bucket.onTime++
    buckets.set(key, bucket)
  }
  const weekly = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([, flow]) => flow)

  const weekTotal = weekly.reduce((s, d) => s + d.total, 0)
  const weekOnTime = weekly.reduce((s, d) => s + d.onTime, 0)

  return {
    people: [...byId.values()],
    inside,
    activity: activity.slice(0, 40),
    todayCount: todayRows.length,
    checkOutCount,
    weekly,
    totalStudents: peopleRows.filter((p) => p.role === 'Estudiante').length,
    punctuality: weekTotal ? Math.round((weekOnTime / weekTotal) * 1000) / 10 : 0,
  }
}

export async function checkInPerson(
  personId: string,
  method: CheckMethod,
): Promise<{ ok: boolean; record: PresenceRecord | null; error?: string }> {
  const id = parseId(personId)
  if (!id || (method !== 'Manual' && method !== 'QR')) return { ok: false, record: null, error: 'Datos de ingreso inválidos.' }

  const [row] = await db.select().from(people).where(eq(people.id, id)).limit(1)
  if (!row) return { ok: false, record: null, error: 'La persona no existe en el directorio.' }
  const person = toPerson(row)

  const [open] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.personId, id), isNull(attendance.exitAt), gte(attendance.entryAt, startOfToday)))
    .limit(1)
  if (open) {
    return {
      ok: false,
      record: { person, entryAt: open.entryAt.getTime(), status: open.status as Punctuality, method: open.method as CheckMethod },
    }
  }

  const now = new Date()
  const status = punctualityFor(row.shift, now)
  const [created] = await db.insert(attendance).values({ personId: id, entryAt: now, status, method }).returning()
  return { ok: true, record: { person, entryAt: created.entryAt.getTime(), status, method } }
}

export async function checkOutPerson(personId: string): Promise<{ ok: boolean }> {
  const id = parseId(personId)
  if (!id) return { ok: false }
  const updated = await db
    .update(attendance)
    .set({ exitAt: new Date() })
    .where(and(eq(attendance.personId, id), isNull(attendance.exitAt), gte(attendance.entryAt, startOfToday)))
    .returning({ id: attendance.id })
  return { ok: updated.length > 0 }
}

export async function findPersonByCedula(cedula: string): Promise<Person | null> {
  const digits = String(cedula).replace(/\D/g, '')
  if (digits.length < 6 || digits.length > 12) return null
  const [row] = await db.select().from(people).where(eq(people.cedula, digits)).limit(1)
  return row ? toPerson(row) : null
}

export interface RegisterInput {
  name: string
  cedula: string
  role: Role
  course: string
  shift: Shift
  email?: string
  phone?: string
}

export type RegisterResult =
  | { ok: true; person: Person }
  | { ok: false; error: string; field?: keyof RegisterInput }

const ROLE_COURSE: Record<Exclude<Role, 'Estudiante'>, string> = { Profesor: 'Docentes', Administrador: 'Administración' }

export async function registerPerson(input: RegisterInput, adminId?: string): Promise<RegisterResult> {
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ')
  const cedula = String(input.cedula ?? '').replace(/\D/g, '')
  const role = input.role
  const shift = input.shift
  const email = String(input.email ?? '').trim().toLowerCase()
  const phone = String(input.phone ?? '').replace(/[^\d+]/g, '')

  if (name.length < 5 || name.length > 80 || !name.includes(' '))
    return { ok: false, field: 'name', error: 'Escribe tu nombre y apellido (5 a 80 caracteres).' }
  if (cedula.length < 6 || cedula.length > 12) return { ok: false, field: 'cedula', error: 'La cédula debe tener entre 6 y 12 dígitos.' }
  if (!ROLES.includes(role)) return { ok: false, field: 'role', error: 'Rol inválido.' }
  if (shift !== 'Mañana' && shift !== 'Tarde') return { ok: false, field: 'shift', error: 'Selecciona una jornada.' }
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    return { ok: false, field: 'email', error: 'El correo no es válido.' }
  if (phone && (phone.length < 7 || phone.length > 15)) return { ok: false, field: 'phone', error: 'El teléfono no es válido.' }

  let course: string
  if (role === 'Estudiante') {
    if (!GROUPS.includes(input.course)) return { ok: false, field: 'course', error: 'Selecciona un curso válido.' }
    course = input.course
  } else {
    const adminKey = adminId ? parseId(adminId) : null
    const [admin] = adminKey ? await db.select().from(people).where(eq(people.id, adminKey)).limit(1) : []
    if (admin?.role !== 'Administrador') return { ok: false, field: 'role', error: 'Solo un administrador puede registrar este rol.' }
    course = ROLE_COURSE[role]
  }

  const [existing] = await db.select({ id: people.id }).from(people).where(eq(people.cedula, cedula)).limit(1)
  if (existing) return { ok: false, field: 'cedula', error: 'Ya existe una persona registrada con esta cédula.' }

  const [created] = await db
    .insert(people)
    .values({ name, cedula, role, course, shift, email: email || null, phone: phone || null })
    .returning()
  return { ok: true, person: toPerson(created) }
}
