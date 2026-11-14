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

export const DIRECTORY: Person[] = [
  { id: 'e01', cedula: '1.023.456.781', name: 'Isabella Martínez', role: 'Estudiante', course: '10°A', shift: 'Mañana' },
  { id: 'e02', cedula: '1.023.889.102', name: 'Santiago Rojas', role: 'Estudiante', course: '10°A', shift: 'Mañana' },
  { id: 'e03', cedula: '1.024.115.640', name: 'Valeria Castaño', role: 'Estudiante', course: '10°A', shift: 'Mañana' },
  { id: 'e04', cedula: '1.022.734.519', name: 'Mateo Pineda', role: 'Estudiante', course: '11°B', shift: 'Mañana' },
  { id: 'e05', cedula: '1.022.901.377', name: 'Camila Duarte', role: 'Estudiante', course: '11°B', shift: 'Mañana' },
  { id: 'e06', cedula: '1.022.650.248', name: 'Samuel Ortiz', role: 'Estudiante', course: '11°B', shift: 'Mañana' },
  { id: 'e07', cedula: '1.025.330.914', name: 'Mariana Acosta', role: 'Estudiante', course: '9°C', shift: 'Mañana' },
  { id: 'e08', cedula: '1.025.478.063', name: 'Emiliano Vargas', role: 'Estudiante', course: '9°C', shift: 'Mañana' },
  { id: 'e09', cedula: '1.025.612.785', name: 'Antonella Ríos', role: 'Estudiante', course: '9°C', shift: 'Mañana' },
  { id: 'e10', cedula: '1.026.204.331', name: 'Tomás Salazar', role: 'Estudiante', course: '8°B', shift: 'Tarde' },
  { id: 'e11', cedula: '1.026.398.570', name: 'Luciana Patiño', role: 'Estudiante', course: '8°B', shift: 'Tarde' },
  { id: 'e12', cedula: '1.026.511.842', name: 'Jerónimo Cárdenas', role: 'Estudiante', course: '8°B', shift: 'Tarde' },
  { id: 'd01', cedula: '79.452.118', name: 'Carlos Méndez', role: 'Profesor', course: 'Docentes', shift: 'Mañana' },
  { id: 'd02', cedula: '52.887.904', name: 'Laura Ríos', role: 'Profesor', course: 'Docentes', shift: 'Mañana' },
  { id: 'd03', cedula: '80.316.552', name: 'Andrés Gómez', role: 'Profesor', course: 'Docentes', shift: 'Mañana' },
  { id: 'd04', cedula: '53.120.479', name: 'Valentina Cruz', role: 'Profesor', course: 'Docentes', shift: 'Tarde' },
  { id: 'd05', cedula: '1.018.442.906', name: 'Sofía Herrera', role: 'Profesor', course: 'Docentes', shift: 'Mañana' },
  { id: 'a01', cedula: '41.779.230', name: 'Patricia Londoño', role: 'Administrador', course: 'Administración', shift: 'Mañana' },
  { id: 'a02', cedula: '71.604.885', name: 'Ricardo Benítez', role: 'Administrador', course: 'Administración', shift: 'Tarde' },
]

export const INITIAL_INSIDE: { id: string; minutesAgo: number; status: 'Puntual' | 'Tardío'; method: 'Manual' | 'QR' }[] = [
  { id: 'e01', minutesAgo: 182, status: 'Puntual', method: 'QR' },
  { id: 'e04', minutesAgo: 176, status: 'Puntual', method: 'QR' },
  { id: 'd01', minutesAgo: 195, status: 'Puntual', method: 'Manual' },
  { id: 'e07', minutesAgo: 168, status: 'Tardío', method: 'QR' },
  { id: 'e05', minutesAgo: 160, status: 'Puntual', method: 'Manual' },
  { id: 'a01', minutesAgo: 210, status: 'Puntual', method: 'Manual' },
  { id: 'd02', minutesAgo: 150, status: 'Puntual', method: 'QR' },
  { id: 'e10', minutesAgo: 64, status: 'Puntual', method: 'QR' },
  { id: 'e08', minutesAgo: 41, status: 'Tardío', method: 'Manual' },
]

export const WEEKLY_FLOW = [
  { day: 'Lun', total: 1164, onTime: 1098 },
  { day: 'Mar', total: 1192, onTime: 1131 },
  { day: 'Mié', total: 1141, onTime: 1062 },
  { day: 'Jue', total: 1205, onTime: 1149 },
  { day: 'Vie', total: 1087, onTime: 1009 },
]

export const TOTAL_STUDENTS = 1248

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
export const GROUPS = ['9°C', '10°A', '11°B']

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
