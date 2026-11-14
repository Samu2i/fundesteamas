// Crea las tablas y carga datos iniciales.
// Uso: node --env-file=.env.local scripts/setup-db.mjs
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const PEOPLE = [
  ['1023456781', 'Isabella Martínez', 'Estudiante', '10°A', 'Mañana'],
  ['1023889102', 'Santiago Rojas', 'Estudiante', '10°A', 'Mañana'],
  ['1024115640', 'Valeria Castaño', 'Estudiante', '10°A', 'Mañana'],
  ['1022734519', 'Mateo Pineda', 'Estudiante', '11°B', 'Mañana'],
  ['1022901377', 'Camila Duarte', 'Estudiante', '11°B', 'Mañana'],
  ['1022650248', 'Samuel Ortiz', 'Estudiante', '11°B', 'Mañana'],
  ['1025330914', 'Mariana Acosta', 'Estudiante', '9°C', 'Mañana'],
  ['1025478063', 'Emiliano Vargas', 'Estudiante', '9°C', 'Mañana'],
  ['1025612785', 'Antonella Ríos', 'Estudiante', '9°C', 'Mañana'],
  ['1026204331', 'Tomás Salazar', 'Estudiante', '8°B', 'Mañana'],
  ['1026398570', 'Luciana Patiño', 'Estudiante', '8°B', 'Mañana'],
  ['1026511842', 'Jerónimo Cárdenas', 'Estudiante', '8°B', 'Mañana'],
  ['79452118', 'Carlos Méndez', 'Profesor', 'Docentes', 'Mañana'],
  ['52887904', 'Laura Ríos', 'Profesor', 'Docentes', 'Mañana'],
  ['80316552', 'Andrés Gómez', 'Profesor', 'Docentes', 'Mañana'],
  ['53120479', 'Valentina Cruz', 'Profesor', 'Docentes', 'Tarde'],
  ['1018442906', 'Sofía Herrera', 'Profesor', 'Docentes', 'Mañana'],
  ['41779230', 'Patricia Londoño', 'Administrador', 'Administración', 'Mañana'],
  ['71604885', 'Ricardo Benítez', 'Administrador', 'Administración', 'Tarde'],
]

const statements = [
  `CREATE TABLE IF NOT EXISTS people (
    id serial PRIMARY KEY,
    cedula text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('Estudiante','Profesor','Administrador')),
    course text NOT NULL,
    shift text NOT NULL CHECK (shift IN ('Mañana','Tarde')),
    email text,
    phone text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id serial PRIMARY KEY,
    person_id integer NOT NULL,
    entry_at timestamptz NOT NULL DEFAULT now(),
    exit_at timestamptz,
    status text NOT NULL CHECK (status IN ('Puntual','Tardío')),
    method text NOT NULL CHECK (method IN ('Manual','QR'))
  )`,
  `CREATE INDEX IF NOT EXISTS attendance_entry_idx ON attendance (entry_at)`,
  `CREATE INDEX IF NOT EXISTS attendance_person_idx ON attendance (person_id)`,
]

for (const sql of statements) await pool.query(sql)

for (const [cedula, name, role, course, shift] of PEOPLE) {
  await pool.query(
    'INSERT INTO people (cedula, name, role, course, shift) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (cedula) DO NOTHING',
    [cedula, name, role, course, shift],
  )
}

const { rows: existing } = await pool.query('SELECT count(*)::int AS n FROM attendance')
if (existing[0].n === 0) {
  const { rows: people } = await pool.query('SELECT id FROM people ORDER BY id')
  // Historial de los últimos 6 días hábiles (entradas con salida) + quienes están dentro hoy.
  for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
    for (const p of people) {
      if (Math.random() < 0.15) continue
      const late = Math.random() < 0.12
      await pool.query(
        `INSERT INTO attendance (person_id, entry_at, exit_at, status, method)
         VALUES ($1,
           date_trunc('day', now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota' - ($2 || ' days')::interval + ($3 || ' minutes')::interval,
           date_trunc('day', now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota' - ($2 || ' days')::interval + ($4 || ' minutes')::interval,
           $5, $6)`,
        [p.id, daysAgo, 6 * 60 + 40 + Math.floor(Math.random() * (late ? 60 : 28)) + (late ? 30 : 0), 13 * 60 + 20 + Math.floor(Math.random() * 40), late ? 'Tardío' : 'Puntual', Math.random() < 0.6 ? 'QR' : 'Manual'],
      )
    }
  }
  const today = [
    [1, 182, 'Puntual', 'QR'],
    [4, 176, 'Puntual', 'QR'],
    [13, 195, 'Puntual', 'Manual'],
    [7, 168, 'Tardío', 'QR'],
    [5, 160, 'Puntual', 'Manual'],
    [18, 210, 'Puntual', 'Manual'],
    [14, 150, 'Puntual', 'QR'],
    [10, 64, 'Puntual', 'QR'],
    [8, 41, 'Tardío', 'Manual'],
  ]
  for (const [personId, minutesAgo, status, method] of today) {
    await pool.query(
      `INSERT INTO attendance (person_id, entry_at, status, method) VALUES ($1, now() - ($2 || ' minutes')::interval, $3, $4)`,
      [personId, minutesAgo, status, method],
    )
  }
}

const { rows } = await pool.query(
  'SELECT (SELECT count(*) FROM people)::int AS people, (SELECT count(*) FROM attendance)::int AS attendance',
)
console.log('Base de datos lista:', rows[0])
await pool.end()
