import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
});
