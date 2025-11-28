import { db, sql as pgSql } from '../db';
import { playerStats, rounds } from '../db/schema';
import { eq, and, sql as drizzleSql } from 'drizzle-orm';
import { getRoundState } from './round.service';

// Обработка тапа по гусю
export async function processTap(roundId: string, userId: string, userRole: string): Promise<{
    success: boolean;
    score: number;
    taps: number;
    message?: string;
} | null> {
    // Начинаем транзакцию для обеспечения консистентности
    return await pgSql.begin(async (_tx) => {
        const txDb = db;

        // Получаем раунд
        const [round] = await txDb.select().from(rounds).where(eq(rounds.id, roundId));

        if (!round) {
            return { success: false, score: 0, taps: 0, message: 'Раунд не найден' };
        }

        // Проверяем, что раунд активен
        const state = getRoundState(round);
        if (state !== 'active') {
            return { success: false, score: 0, taps: 0, message: 'Раунд не активен' };
        }

        // Получаем или создаем статистику игрока с блокировкой строки (FOR UPDATE)
        // Это предотвращает race conditions при одновременных тапах
        const existingStats = await txDb
            .select()
            .from(playerStats)
            .where(
                and(
                    eq(playerStats.roundId, roundId),
                    eq(playerStats.userId, userId)
                )
            )
            .for('update'); // Блокируем строку для обновления

        let currentTaps = 0;
        let currentScore = 0;

        if (existingStats.length > 0) {
            currentTaps = existingStats[0].taps;
            currentScore = existingStats[0].score;
        }

        // Увеличиваем счетчик тапов
        const newTaps = currentTaps + 1;

        // Рассчитываем очки
        // Если роль "nikita", очки не начисляются
        let pointsToAdd = 0;
        if (userRole !== 'nikita') {
            // Каждый 11-й тап дает 10 очков, остальные - 1 очко
            pointsToAdd = (newTaps % 11 === 0) ? 10 : 1;
        }

        const newScore = currentScore + pointsToAdd;

        // Обновляем или создаем статистику игрока
        if (existingStats.length > 0) {
            await txDb
                .update(playerStats)
                .set({
                    taps: newTaps,
                    score: newScore,
                })
                .where(eq(playerStats.id, existingStats[0].id));
        } else {
            await txDb.insert(playerStats).values({
                roundId,
                userId,
                taps: newTaps,
                score: newScore,
            });
        }

        // Обновляем общий счет раунда (только если роль не "nikita")
        if (userRole !== 'nikita') {
            await txDb
                .update(rounds)
                .set({
                    totalScore: drizzleSql`${rounds.totalScore} + ${pointsToAdd}`,
                })
                .where(eq(rounds.id, roundId));
        }

        return {
            success: true,
            score: newScore,
            taps: newTaps,
        };
    });
}
