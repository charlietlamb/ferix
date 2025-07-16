import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from '../auth/users'
import { teams } from './teams'

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  teamId: text('team_id').references(() => teams.id),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})
