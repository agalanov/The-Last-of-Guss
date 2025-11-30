// Устанавливаем переменные окружения для интеграционных тестов
// Этот файл выполняется ДО загрузки любых модулей
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5439/guss_game';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ROUND_DURATION = '60';
process.env.COOLDOWN_DURATION = '30';
