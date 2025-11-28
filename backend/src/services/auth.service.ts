import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, type User, type NewUser } from '../db/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Определение роли на основе имени пользователя
function determineRole(username: string): 'admin' | 'nikita' | 'survivor' {
    if (username === 'admin') return 'admin';
    if (username === 'Никита') return 'nikita';
    return 'survivor';
}

// Регистрация или вход пользователя
export async function loginOrRegister(username: string, password: string): Promise<{ user: User; token: string } | null> {
    // Ищем пользователя в базе
    const existingUsers = await db.select().from(users).where(eq(users.username, username));

    if (existingUsers.length > 0) {
        // Пользователь существует - проверяем пароль
        const user = existingUsers[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null; // Неверный пароль
        }

        // Генерируем JWT токен
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user, token };
    } else {
        // Пользователь не существует - регистрируем
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const role = determineRole(username);

        const newUser: NewUser = {
            username,
            password: hashedPassword,
            role,
        };

        const [createdUser] = await db.insert(users).values(newUser).returning();

        // Генерируем JWT токен
        const token = jwt.sign(
            { userId: createdUser.id, username: createdUser.username, role: createdUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user: createdUser, token };
    }
}

// Верификация JWT токена
export function verifyToken(token: string): { userId: string; username: string; role: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string };
        return decoded;
    } catch (error) {
        return null;
    }
}
