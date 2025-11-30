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
    // Начинаем транзакцию для обеспечения консистентности (обновление статистики и раунда)
    return await pgSql.begin(async (_tx) => {
        const txDb = db;

        // 1. Получаем раунд (чтение без блокировки)
        const [round] = await txDb.select().from(rounds).where(eq(rounds.id, roundId));

        if (!round) {
            return { success: false, score: 0, taps: 0, message: 'Раунд не найден' };
        }

        // 2. Проверяем, что раунд активен
        const state = getRoundState(round);
        if (state !== 'active') {
            return { success: false, score: 0, taps: 0, message: 'Раунд не активен' };
        }

        // 3. Атомарное обновление статистики игрока (Upsert)
        // Используем INSERT ... ON CONFLICT DO UPDATE для атомарности
        // Это избавляет от необходимости делать SELECT ... FOR UPDATE и защищает от Race Conditions

        const isNikita = userRole === 'nikita';
        const initialScore = isNikita ? 0 : 1; // Первый тап дает 1 очко (1 % 11 != 0)

        // SQL для обновления очков:
        // Если не Никита: score + (если (taps + 1) % 11 == 0 то 10 иначе 1)
        // Если Никита: score (не меняется)
        const updateScoreSql = isNikita
            ? playerStats.score
            : drizzleSql`${playerStats.score} + CASE WHEN (${playerStats.taps} + 1) % 11 = 0 THEN 10 ELSE 1 END`;

        const [updatedStats] = await txDb
            .insert(playerStats)
            .values({
                roundId,
                userId,
                taps: 1,
                score: initialScore,
            })
            .onConflictDoUpdate({
                target: [playerStats.roundId, playerStats.userId],
                set: {
                    taps: drizzleSql`${playerStats.taps} + 1`,
                    score: updateScoreSql,
                },
            })
            .returning({
                taps: playerStats.taps,
                score: playerStats.score,
            });

        // 4. Обновляем общий счет раунда (только если роль не "nikita")
        if (!isNikita) {
            // Вычисляем, сколько очков было добавлено
            // Логика дублируется из SQL, но это необходимо для обновления раунда
            // Мы знаем новые тапы, можем вычислить сколько очков дал этот тап
            const pointsAdded = (updatedStats.taps % 11 === 0) ? 10 : 1;

            await txDb
                .update(rounds)
                .set({
                    totalScore: drizzleSql`${rounds.totalScore} + ${pointsAdded}`,
                })
                .where(eq(rounds.id, roundId));
        }

        return {
            success: true,
            score: updatedStats.score,
            taps: updatedStats.taps,
        };
    });
}
