import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const people = pgTable('people', {
  id: serial('id').primaryKey(),
  cedula: text('cedula').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  course: text('course').notNull(),
  shift: text('shift').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull(),
  entryAt: timestamp('entry_at', { withTimezone: true }).notNull().defaultNow(),
  exitAt: timestamp('exit_at', { withTimezone: true }),
  status: text('status').notNull(),
  method: text('method').notNull(),
})
