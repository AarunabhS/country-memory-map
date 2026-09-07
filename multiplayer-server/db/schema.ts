import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', { code: text('code').primaryKey(), version: integer('version').notNull().default(0), body: text('body').notNull(), expiresAt: integer('expires_at').notNull() }, t => [index('idx_rooms_expiry').on(t.expiresAt)]);
export const rateLimits = sqliteTable('rate_limits', { key: text('key').primaryKey(), count: integer('count').notNull().default(0), expiresAt: integer('expires_at').notNull() }, t => [index('idx_rate_expiry').on(t.expiresAt)]);
