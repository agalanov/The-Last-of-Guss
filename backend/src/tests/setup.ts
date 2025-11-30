import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

// Hardcoded test database connection
const testSql = postgres('postgresql://postgres:postgres@localhost:5439/guss_game');
export const testDb = drizzle(testSql, { schema });

export async function cleanupDatabase() {
    // Используем отдельные TRUNCATE для каждой таблицы
    // RESTART IDENTITY сбрасывает автоинкремент
    // CASCADE автоматически очищает зависимые таблицы
    await testSql`TRUNCATE TABLE player_stats RESTART IDENTITY CASCADE`;
    await testSql`TRUNCATE TABLE rounds RESTART IDENTITY CASCADE`;
    await testSql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;
}

export async function closeDatabaseConnection() {
    await testSql.end();
}
