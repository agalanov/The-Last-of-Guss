import { db } from '../db';
import { rounds, playerStats, users, type Round, type NewRound } from '../db/schema';
import { eq, desc, sql as drizzleSql } from 'drizzle-orm';

const ROUND_DURATION = parseInt(process.env.ROUND_DURATION || '60', 10); // секунды
const COOLDOWN_DURATION = parseInt(process.env.COOLDOWN_DURATION || '30', 10); // секунды

// Состояние раунда
export type RoundState = 'cooldown' | 'active' | 'finished';

// Определение текущего состояния раунда
export function getRoundState(round: Round): RoundState {
    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime) {
        return 'cooldown';
    } else if (now >= startTime && now <= endTime) {
        return 'active';
    } else {
        return 'finished';
    }
}

// Создание нового раунда
export async function createRound(): Promise<Round> {
    const now = new Date();

    // Время старта = текущее время + cooldown
    const startTime = new Date(now.getTime() + COOLDOWN_DURATION * 1000);

    // Время окончания = время старта + длительность раунда
    const endTime = new Date(startTime.getTime() + ROUND_DURATION * 1000);

    const newRound: NewRound = {
        startTime,
        endTime,
        totalScore: 0,
    };

    const [createdRound] = await db.insert(rounds).values(newRound).returning();

    return createdRound;
}

// Получение списка раундов (активные и запланированные)
export async function getRounds(): Promise<Round[]> {
    // Получаем все раунды, отсортированные по времени создания (новые первые)
    const allRounds = await db.select().from(rounds).orderBy(desc(rounds.createdAt));

    return allRounds;
}

// Получение деталей раунда с информацией о победителе и статистике игрока
export async function getRoundDetails(roundId: string, userId?: string): Promise<{
    round: Round;
    state: RoundState;
    winner: { username: string; score: number } | null;
    playerScore: number;
    playerTaps: number;
} | null> {
    // Получаем раунд
    const [round] = await db.select().from(rounds).where(eq(rounds.id, roundId));

    if (!round) {
        return null;
    }

    const state = getRoundState(round);

    // Получаем информацию о победителе (если раунд завершен)
    let winner: { username: string; score: number } | null = null;

    if (state === 'finished') {
        // Находим игрока с максимальным счетом
        const topPlayer = await db
            .select({
                username: users.username,
                score: playerStats.score,
            })
            .from(playerStats)
            .innerJoin(users, eq(playerStats.userId, users.id))
            .where(eq(playerStats.roundId, roundId))
            .orderBy(desc(playerStats.score))
            .limit(1);

        if (topPlayer.length > 0) {
            winner = {
                username: topPlayer[0].username,
                score: topPlayer[0].score,
            };
        }
    }

    // Получаем статистику текущего игрока
    let playerScore = 0;
    let playerTaps = 0;

    if (userId) {
        const [stats] = await db
            .select()
            .from(playerStats)
            .where(
                drizzleSql`${playerStats.roundId} = ${roundId} AND ${playerStats.userId} = ${userId}`
            );

        if (stats) {
            playerScore = stats.score;
            playerTaps = stats.taps;
        }
    }

    return {
        round,
        state,
        winner,
        playerScore,
        playerTaps,
    };
}
