import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loginOrRegister } from '../services/auth.service';

// Схема валидации для логина
const loginSchema = z.object({
    username: z.string().min(1, 'Имя пользователя обязательно'),
    password: z.string().min(1, 'Пароль обязателен'),
});

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // POST /api/auth/login - Логин или регистрация
    fastify.post('/login', async (request, reply) => {
        try {
            const body = loginSchema.parse(request.body);

            const result = await loginOrRegister(body.username, body.password);

            if (!result) {
                return reply.code(401).send({ error: 'Неверный пароль' });
            }

            // Устанавливаем cookie с токеном
            reply.setCookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 дней
                path: '/',
            });

            return {
                user: {
                    id: result.user.id,
                    username: result.user.username,
                    role: result.user.role,
                },
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: error.errors[0].message });
            }

            console.error('Ошибка при логине:', error);
            return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
        }
    });

    // POST /api/auth/logout - Выход
    fastify.post('/logout', async (_request, reply) => {
        reply.clearCookie('token', { path: '/' });
        return { success: true };
    });

    // GET /api/auth/me - Получение информации о текущем пользователе
    fastify.get('/me', {
        preHandler: [fastify.authMiddleware],
    }, async (request) => {
        return {
            user: request.user,
        };
    });
}
