export const formatTime = (value: Date | number, withSeconds = false) =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  }).format(value)

export const formatLongDate = (value: Date | number) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(value)

export const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value)

export const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`
}

export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export type SessionStatus = 'live' | 'done' | 'soon'

export const mondayIndex = (date: Date) => (date.getDay() + 6) % 7

export function getSessionStatus(day: number, start: string, end: string, now: Date): SessionStatus {
  const today = mondayIndex(now)
  if (today > 4) return 'soon'
  if (day < today) return 'done'
  if (day > today) return 'soon'
  const current = now.getHours() * 60 + now.getMinutes()
  if (current >= toMinutes(end)) return 'done'
  if (current >= toMinutes(start)) return 'live'
  return 'soon'
}

export function sessionProgress(start: string, end: string, now: Date) {
  const current = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const s = toMinutes(start)
  const e = toMinutes(end)
  return Math.min(1, Math.max(0, (current - s) / (e - s)))
}
