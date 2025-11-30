import { cleanupDatabase, testDb } from '../tests/setup';
import { users } from '../db/schema';

describe('Cleanup Test', () => {
    afterAll(async () => {
        await cleanupDatabase();
        // Даем время на закрытие соединения
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should cleanup database', async () => {
        try {
            console.log('Starting cleanup test...');

            // Вставляем тестовые данные
            await testDb.insert(users).values({
                username: 'test_cleanup',
                password: 'test',
                role: 'survivor',
            });

            console.log('Inserted test user');

            // Очищаем БД
            await cleanupDatabase();

            console.log('Cleanup successful');

            // Проверяем, что данные удалены
            const result = await testDb.select().from(users);
            expect(result.length).toBe(0);
        } catch (error) {
            console.error('Test error:', error);
            throw error;
        }
    });
});
