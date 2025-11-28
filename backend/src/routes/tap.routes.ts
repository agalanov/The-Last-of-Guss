import { FastifyInstance } from 'fastify';
import { processTap } from '../services/tap.service';

export async function tapRoutes(fastify: FastifyInstance): Promise<void> {
    // POST /api/rounds/:id/tap - Тап по гусю
    fastify.post('/:id/tap', {
        preHandler: [fastify.authMiddleware],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user?.userId;
            const userRole = request.user?.role;

            if (!userId || !userRole) {
                return reply.code(401).send({ error: 'Требуется аутентификация' });
            }

            const result = await processTap(id, userId, userRole);

            if (!result) {
                return reply.code(500).send({ error: 'Ошибка при обработке тапа' });
            }

            if (!result.success) {
                return reply.code(400).send({ error: result.message });
            }

            return {
                score: result.score,
                taps: result.taps,
            };
        } catch (error) {
            console.error('Ошибка при обработке тапа:', error);
            return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
        }
    });
}
