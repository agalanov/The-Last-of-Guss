# Walkthrough: Тестирование Backend

Этот документ описывает всю проделанную работу по добавлению unit-тестов и интеграционных тестов в проект "The Last of Guss".

## Содержание

1. [Демонстрация атомарных операций](#демонстрация-атомарных-операций)
2. [Настройка Jest](#настройка-jest)
3. [Unit-тесты](#unit-тесты)
4. [Интеграционные тесты](#интеграционные-тесты)
5. [Запуск тестов](#запуск-тестов)

---

## Демонстрация атомарных операций

### Рефакторинг tap.service.ts

Я продемонстрировал применение **атомарных операций обновления** путем рефакторинга [tap.service.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/src/services/tap.service.ts).

#### Было (пессимистическая блокировка):
```typescript
// SELECT ... FOR UPDATE - блокировка строки
const existingStats = await txDb
    .select()
    .from(playerStats)
    .where(...)
    .for('update');

// Вычисление в приложении
const newTaps = currentTaps + 1;
const newScore = currentScore + pointsToAdd;

// Отдельный UPDATE
await txDb.update(playerStats).set({ taps: newTaps, score: newScore });
```

#### Стало (атомарный upsert):
```typescript
// INSERT ... ON CONFLICT DO UPDATE - атомарная операция
const [updatedStats] = await txDb
    .insert(playerStats)
    .values({ roundId, userId, taps: 1, score: initialScore })
    .onConflictDoUpdate({
        target: [playerStats.roundId, playerStats.userId],
        set: {
            taps: drizzleSql`${playerStats.taps} + 1`,
            score: drizzleSql`${playerStats.score} + CASE WHEN (${playerStats.taps} + 1) % 11 = 0 THEN 10 ELSE 1 END`,
        },
    })
    .returning({ taps: playerStats.taps, score: playerStats.score });
```

#### Преимущества:
- ✅ **Атомарность**: БД гарантирует, что операция выполняется атомарно
- ✅ **Производительность**: Меньше запросов к БД
- ✅ **Конкурентность**: Нет необходимости в явной блокировке
- ✅ **Простота**: Логика вычислений в SQL, а не в приложении

---

## Настройка Jest

### Установленные пакеты

```bash
npm install --save-dev jest ts-jest @types/jest ts-node cross-env
```

### Конфигурация

#### [jest.config.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/jest.config.ts)
```typescript
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    roots: ['<rootDir>/src'],
    setupFiles: ['<rootDir>/jest.setup.integration.ts'],
};

export default config;
```

#### [jest.setup.integration.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/jest.setup.integration.ts)
```typescript
// Переменные окружения для интеграционных тестов
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/guss_game';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ROUND_DURATION = '60';
process.env.COOLDOWN_DURATION = '30';
```

### Скрипты в package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:integration": "jest --config jest.config.ts --testMatch \"**/*.integration.test.ts\""
  }
}
```

---

## Unit-тесты

### 1. round.service.test.ts

Тесты для функции `getRoundState`, которая определяет состояние раунда.

#### [src/services/round.service.test.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/src/services/round.service.test.ts)

**Покрытие:**
- ✅ Состояние "cooldown" (до начала раунда)
- ✅ Состояние "active" (в момент старта)
- ✅ Состояние "active" (во время раунда)
- ✅ Состояние "active" (в момент окончания)
- ✅ Состояние "finished" (после окончания)

**Особенности:**
- Использование `jest.useFakeTimers()` для контроля времени
- Создание mock-объектов раундов
- Проверка граничных условий

### 2. auth.service.test.ts

Тесты для функций аутентификации и определения ролей.

#### [src/services/auth.service.test.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/src/services/auth.service.test.ts)

**Покрытие:**
- ✅ `determineRole`: определение роли "admin"
- ✅ `determineRole`: определение роли "nikita"
- ✅ `determineRole`: определение роли "survivor" (по умолчанию)
- ✅ `verifyToken`: успешная верификация токена
- ✅ `verifyToken`: обработка невалидного токена

**Особенности:**
- Мокирование модуля `jsonwebtoken`
- Тестирование различных сценариев аутентификации

### Результаты unit-тестов

```bash
npm test
```

```
Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        6.367 s
```

---

## Интеграционные тесты

### Настройка тестового окружения

#### [src/tests/setup.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/src/tests/setup.ts)

```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

// Hardcoded подключение к тестовой БД
const testSql = postgres('postgresql://postgres:postgres@localhost:5432/guss_game');
export const testDb = drizzle(testSql, { schema });

export async function cleanupDatabase() {
    // TRUNCATE CASCADE для очистки с учетом внешних ключей
    await testSql`TRUNCATE TABLE player_stats, rounds, users RESTART IDENTITY CASCADE`;
}

export async function closeDatabaseConnection() {
    await testSql.end();
}
```

### tap.service.integration.test.ts

Интеграционные тесты для проверки работы с реальной БД.

#### [src/services/tap.service.integration.test.ts](file:///d:/Job/The%20Last%20of%20Guss/backend/src/services/tap.service.integration.test.ts)

**Тестовые сценарии:**

1. **Успешная обработка тапа**
   - Создание пользователя и раунда
   - Обработка тапа
   - Проверка обновления статистики в БД

2. **Расчет очков для 11-го тапа**
   - 10 обычных тапов (по 1 очку)
   - 11-й тап (бонус 10 очков)
   - Итого: 20 очков

3. **Логика для роли "Nikita"**
   - Тапы учитываются
   - Очки НЕ начисляются

4. **Тест конкурентности (атомарность)**
   - 50 параллельных тапов
   - Проверка корректности итогового счета
   - Ожидаемый результат: 86 очков
     - 4 тапа по 10 очков (11, 22, 33, 44) = 40
     - 46 тапов по 1 очку = 46
     - Итого: 86

### Текущий статус

⚠️ **Интеграционные тесты требуют дополнительной отладки**

**Проблема:** Функция `cleanupDatabase()` падает при выполнении.

**Возможные причины:**
- Конфликты с внешними ключами
- Проблемы с правами доступа PostgreSQL
- Необходимость использования отдельной тестовой БД

**Рекомендации:**

1. **Создать отдельную тестовую БД:**
   ```bash
   docker exec guss_postgres psql -U postgres -c "CREATE DATABASE guss_game_test;"
   ```

2. **Обновить строку подключения в setup.ts:**
   ```typescript
   const testSql = postgres('postgresql://postgres:postgres@localhost:5432/guss_game_test');
   ```

3. **Запустить миграции для тестовой БД:**
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guss_game_test npm run db:push
   ```

4. **Альтернативный подход к cleanup:**
   ```typescript
   export async function cleanupDatabase() {
       await testSql`DELETE FROM player_stats`;
       await testSql`DELETE FROM rounds WHERE id NOT IN (SELECT DISTINCT round_id FROM player_stats)`;
       await testSql`DELETE FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM player_stats)`;
   }
   ```

---

## Запуск тестов

### Все unit-тесты
```bash
cd backend
npm test
```

### Интеграционные тесты
```bash
cd backend
npm run test:integration
```

### Все тесты вместе
```bash
cd backend
npm test && npm run test:integration
```

### С подробным выводом
```bash
npm test -- --verbose
npm run test:integration -- --verbose --runInBand
```

---

## Структура проекта

```
backend/
├── src/
│   ├── services/
│   │   ├── tap.service.ts                    ← Рефакторинг с атомарными операциями
│   │   ├── tap.service.integration.test.ts   ← Интеграционные тесты
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts              ← Unit-тесты
│   │   ├── round.service.ts
│   │   └── round.service.test.ts             ← Unit-тесты
│   └── tests/
│       └── setup.ts                           ← Настройка тестового окружения
├── jest.config.ts                             ← Конфигурация Jest
├── jest.setup.integration.ts                  ← Переменные окружения для тестов
└── package.json                               ← Скрипты для запуска тестов
```

---

## Итоги

### Выполнено ✅

1. **Демонстрация атомарных операций**
   - Рефакторинг `tap.service.ts` с использованием `INSERT ... ON CONFLICT`
   - Улучшение производительности и конкурентности

2. **Настройка Jest**
   - Установка всех необходимых пакетов
   - Конфигурация для unit и integration тестов

3. **Unit-тесты**
   - `round.service.test.ts` - 5 тестов ✅
   - `auth.service.test.ts` - 5 тестов ✅
   - Все тесты проходят успешно

4. **Интеграционные тесты**
   - Создана структура тестов
   - Настроено тестовое окружение
   - Написаны 4 тестовых сценария

### Требует доработки ⚠️

1. **Отладка интеграционных тестов**
   - Проблема с функцией `cleanupDatabase()`
   - Рекомендуется использовать отдельную тестовую БД

2. **Расширение покрытия**
   - Добавить тесты для `round.service.ts` (createRound, getRounds)
   - Добавить тесты для роутов (e2e тесты)

### Рекомендации для продакшена

1. **CI/CD Pipeline**
   ```yaml
   test:
     - npm test                    # Unit-тесты
     - npm run test:integration    # Интеграционные тесты
   ```

2. **Отдельная тестовая БД**
   - Использовать `guss_game_test` для изоляции
   - Автоматическое создание/удаление при запуске тестов

3. **Code Coverage**
   ```bash
   npm test -- --coverage
   ```

4. **Pre-commit hooks**
   ```json
   {
     "husky": {
       "hooks": {
         "pre-commit": "npm test"
       }
     }
   }
   ```
