import { FastifyInstance } from 'fastify';
import { createRound, getRounds, getRoundDetails } from '../services/round.service';

export async function roundRoutes(fastify: FastifyInstance): Promise<void> {
    // GET /api/rounds - Получение списка раундов
    fastify.get('/', {
        preHandler: [fastify.authMiddleware],
    }, async (_request, reply) => {
        try {
            const rounds = await getRounds();

            return { rounds };
        } catch (error) {
            console.error('Ошибка при получении раундов:', error);
            return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
        }
    });

    // POST /api/rounds - Создание нового раунда (только админ)
    fastify.post('/', {
        preHandler: [fastify.authMiddleware, fastify.requireAdmin],
    }, async (_request, reply) => {
        try {
            const round = await createRound();

            return { round };
        } catch (error) {
            console.error('Ошибка при создании раунда:', error);
            return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
        }
    });

    // GET /api/rounds/:id - Получение деталей раунда
    fastify.get('/:id', {
        preHandler: [fastify.authMiddleware],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user?.userId;

            const details = await getRoundDetails(id, userId);

            if (!details) {
                return reply.code(404).send({ error: 'Раунд не найден' });
            }

            return details;
        } catch (error) {
            console.error('Ошибка при получении деталей раунда:', error);
            return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
        }
    });
}
