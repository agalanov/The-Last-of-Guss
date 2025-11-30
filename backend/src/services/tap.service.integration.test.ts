import { processTap } from './tap.service';
import { createRound } from './round.service';
import { cleanupDatabase, closeDatabaseConnection, testDb } from '../tests/setup';
import { users, rounds, playerStats } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Tap Service Integration', () => {
    // Увеличиваем таймаут, так как работа с БД может занять время
    jest.setTimeout(30000);

    beforeEach(async () => {
        await cleanupDatabase();
    });

    afterAll(async () => {
        await cleanupDatabase();
        await closeDatabaseConnection();
    });

    async function createTestUser(username: string, role: 'survivor' | 'nikita' = 'survivor') {
        const [user] = await testDb.insert(users).values({
            username,
            password: 'hashed_password',
            role,
        }).returning();
        return user;
    }

    it('should successfully process a tap and update stats', async () => {
        const user = await createTestUser('test_user');
        const round = await createRound();

        // Ждем начала раунда (cooldown)
        // В тестах мы можем хакнуть время или просто обновить startTime в БД
        await testDb.update(rounds)
            .set({ startTime: new Date(Date.now() - 1000) }) // Раунд начался 1 сек назад
            .where(eq(rounds.id, round.id));

        const result = await processTap(round.id, user.id, user.role);

        expect(result).not.toBeNull();
        expect(result?.success).toBe(true);
        expect(result?.taps).toBe(1);
        expect(result?.score).toBe(1); // 1-й тап = 1 очко

        // Проверяем БД
        const [stats] = await testDb.select().from(playerStats).where(eq(playerStats.userId, user.id));
        expect(stats.taps).toBe(1);
        expect(stats.score).toBe(1);
    });

    it('should correctly calculate score for 11th tap', async () => {
        const user = await createTestUser('test_user_11');
        const round = await createRound();

        await testDb.update(rounds)
            .set({ startTime: new Date(Date.now() - 1000) })
            .where(eq(rounds.id, round.id));

        // Делаем 10 тапов
        for (let i = 0; i < 10; i++) {
            await processTap(round.id, user.id, user.role);
        }

        // 11-й тап
        const result = await processTap(round.id, user.id, user.role);

        expect(result?.taps).toBe(11);
        // 10 тапов по 1 очку + 11-й тап по 10 очков = 20
        expect(result?.score).toBe(20);
    });

    it('should not increase score for Nikita', async () => {
        const user = await createTestUser('Nikita', 'nikita');
        const round = await createRound();

        await testDb.update(rounds)
            .set({ startTime: new Date(Date.now() - 1000) })
            .where(eq(rounds.id, round.id));

        const result = await processTap(round.id, user.id, user.role);

        expect(result?.success).toBe(true);
        expect(result?.taps).toBe(1);
        expect(result?.score).toBe(0); // Никита не получает очки
    });

    it('should handle concurrency correctly (Atomic Updates)', async () => {
        const user = await createTestUser('concurrent_user');
        const round = await createRound();

        await testDb.update(rounds)
            .set({ startTime: new Date(Date.now() - 1000) })
            .where(eq(rounds.id, round.id));

        // Запускаем 50 параллельных тапов
        const promises = [];
        for (let i = 0; i < 50; i++) {
            promises.push(processTap(round.id, user.id, user.role));
        }

        await Promise.all(promises);

        // Проверяем результат в БД
        const [stats] = await testDb.select().from(playerStats).where(eq(playerStats.userId, user.id));

        expect(stats.taps).toBe(50);
        // Очки: 
        // 50 тапов.
        // 11, 22, 33, 44 - это 4 тапа по 10 очков = 40 очков
        // Остальные 46 тапов по 1 очку = 46 очков
        // Итого: 86 очков
        expect(stats.score).toBe(86);
    });
});
