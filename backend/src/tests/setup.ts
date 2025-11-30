import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

// Hardcoded test database connection
const testSql = postgres('postgresql://postgres:postgres@localhost:5432/guss_game');
export const testDb = drizzle(testSql, { schema });

export async function cleanupDatabase() {
    // Используем TRUNCATE CASCADE для очистки таблиц с учетом внешних ключей
    await testSql`TRUNCATE TABLE player_stats, rounds, users RESTART IDENTITY CASCADE`;
}

export async function closeDatabaseConnection() {
    await testSql.end();
}
