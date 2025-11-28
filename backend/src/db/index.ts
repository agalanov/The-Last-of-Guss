import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Создаем подключение к PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/guss_game';

// Клиент для выполнения запросов
export const sql = postgres(connectionString);

// Инстанс Drizzle ORM
export const db = drizzle(sql, { schema });
