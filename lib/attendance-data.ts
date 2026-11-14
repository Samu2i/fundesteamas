export type Role = 'Estudiante' | 'Profesor' | 'Administrador'
export type Shift = 'Mañana' | 'Tarde'

export interface Person {
  id: string
  cedula: string
  name: string
  role: Role
  course: string
  shift: Shift
}

export const ROLES: Role[] = ['Estudiante', 'Profesor', 'Administrador']

export function formatCedula(value: string) {
  return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export interface Block {
  id: string
  start: string
  end: string
  isBreak?: boolean
}

export const BLOCKS: Block[] = [
  { id: 'b1', start: '07:00', end: '07:55' },
  { id: 'b2', start: '08:00', end: '08:55' },
  { id: 'b3', start: '09:00', end: '09:55' },
  { id: 'break', start: '09:55', end: '10:20', isBreak: true },
  { id: 'b4', start: '10:20', end: '11:15' },
  { id: 'b5', start: '11:20', end: '12:15' },
  { id: 'b6', start: '12:20', end: '13:15' },
]

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
export const GROUPS = ['8°B', '9°C', '10°A', '11°B']

const SUBJECTS = [
  { subject: 'Matemáticas', teacher: 'Carlos Méndez', room: 'Aula 201' },
  { subject: 'Física', teacher: 'Laura Ríos', room: 'Lab. Ciencias' },
  { subject: 'Programación', teacher: 'Andrés Gómez', room: 'Lab. Sistemas' },
  { subject: 'Robótica', teacher: 'Valentina Cruz', room: 'Taller Maker' },
  { subject: 'Inglés', teacher: 'Sofía Herrera', room: 'Aula 104' },
  { subject: 'Química', teacher: 'Diego Paredes', room: 'Lab. Ciencias 2' },
  { subject: 'Artes digitales', teacher: 'Mariana López', room: 'Estudio Media' },
]

export const TEACHERS = SUBJECTS.map((s) => s.teacher)
export const SUBJECT_NAMES = SUBJECTS.map((s) => s.subject)

export interface ClassSession {
  id: string
  day: number
  blockId: string
  start: string
  end: string
  group: string
  subject: string
  teacher: string
  room: string
}

export const SCHEDULE: ClassSession[] = DAYS.flatMap((_, day) =>
  GROUPS.flatMap((group, gi) =>
    BLOCKS.filter((b) => !b.isBreak).map((block, bi) => {
      const s = SUBJECTS[(day * 3 + gi * 2 + bi) % SUBJECTS.length]
      return {
        id: `${day}-${group}-${block.id}`,
        day,
        blockId: block.id,
        start: block.start,
        end: block.end,
        group,
        ...s,
      }
    }),
  ),
)
