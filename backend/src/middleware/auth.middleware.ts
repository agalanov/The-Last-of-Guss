import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../services/auth.service';

// Расширяем тип Request для добавления информации о пользователе
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            userId: string;
            username: string;
            role: string;
        };
    }

    // Расширяем тип FastifyInstance для добавления middleware декораторов
    interface FastifyInstance {
        authMiddleware: typeof authMiddleware;
        requireAdmin: typeof requireAdmin;
    }
}

// Middleware для проверки аутентификации
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = request.cookies.token;

    if (!token) {
        reply.code(401).send({ error: 'Требуется аутентификация' });
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        reply.code(401).send({ error: 'Невалидный токен' });
        return;
    }

    // Добавляем информацию о пользователе в request
    request.user = decoded;
}

// Middleware для проверки роли администратора
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user || request.user.role !== 'admin') {
        reply.code(403).send({ error: 'Требуются права администратора' });
        return;
    }
}
