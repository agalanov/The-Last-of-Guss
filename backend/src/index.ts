import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import * as dotenv from 'dotenv';
import { authMiddleware, requireAdmin } from './middleware/auth.middleware';
import { authRoutes } from './routes/auth.routes';
import { roundRoutes } from './routes/round.routes';
import { tapRoutes } from './routes/tap.routes';

// Загружаем переменные окружения
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);

// Создаем инстанс Fastify
const fastify = Fastify({
    logger: true,
});

// Регистрируем плагины
async function start() {
    try {
        // CORS для фронтенда
        await fastify.register(cors, {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        });

        // Cookie parser
        await fastify.register(cookie);

        // Swagger documentation
        await fastify.register(import('@fastify/swagger'), {
            swagger: {
                info: {
                    title: 'The Last of Guss API',
                    description: 'API documentation for The Last of Guss game',
                    version: '1.0.0',
                },
                host: 'localhost:3001',
                schemes: ['http'],
                consumes: ['application/json'],
                produces: ['application/json'],
                securityDefinitions: {
                    apiKey: {
                        type: 'apiKey',
                        name: 'Cookie',
                        in: 'header',
                    },
                },
            },
        });

        await fastify.register(import('@fastify/swagger-ui'), {
            routePrefix: '/documentation',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: false,
            },
        });

        // Декорируем fastify для добавления middleware
        fastify.decorate('authMiddleware', authMiddleware);
        fastify.decorate('requireAdmin', requireAdmin);

        // Регистрируем роуты
        await fastify.register(authRoutes, { prefix: '/api/auth' });
        await fastify.register(roundRoutes, { prefix: '/api/rounds' });
        await fastify.register(tapRoutes, { prefix: '/api/rounds' });

        // Healthcheck endpoint
        fastify.get('/health', async () => {
            return { status: 'ok' };
        });

        // Запускаем сервер
        await fastify.listen({ port: PORT, host: '0.0.0.0' });

        console.log(`🚀 Сервер запущен на порту ${PORT}`);
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}

start();
