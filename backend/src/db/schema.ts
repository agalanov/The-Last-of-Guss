import { pgTable, uuid, varchar, timestamp, integer, bigint, uniqueIndex } from 'drizzle-orm/pg-core';

// Таблица пользователей
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    // Роли: 'survivor' - обычный игрок, 'nikita' - Никита (тапы не считаются), 'admin' - администратор
    role: varchar('role', { length: 50 }).notNull().default('survivor'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Таблица раундов
export const rounds = pgTable('rounds', {
    id: uuid('id').primaryKey().defaultRandom(),
    // Время начала раунда (после cooldown)
    startTime: timestamp('start_time').notNull(),
    // Время окончания раунда
    endTime: timestamp('end_time').notNull(),
    // Общий счет всех игроков в раунде
    totalScore: bigint('total_score', { mode: 'number' }).notNull().default(0),
    // ID победителя (заполняется после завершения раунда)
    winnerId: uuid('winner_id').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Таблица статистики игроков по раундам
export const playerStats = pgTable('player_stats', {
    id: uuid('id').primaryKey().defaultRandom(),
    roundId: uuid('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Количество тапов игрока в раунде
    taps: integer('taps').notNull().default(0),
    // Очки игрока в раунде
    score: bigint('score', { mode: 'number' }).notNull().default(0),
}, (table) => ({
    // Уникальный индекс: один игрок может иметь только одну запись статистики на раунд
    uniqueRoundUser: uniqueIndex('unique_round_user').on(table.roundId, table.userId),
}));

// Типы для TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Round = typeof rounds.$inferSelect;
export type NewRound = typeof rounds.$inferInsert;

export type PlayerStats = typeof playerStats.$inferSelect;
export type NewPlayerStats = typeof playerStats.$inferInsert;
