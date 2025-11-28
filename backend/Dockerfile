# Используем Node.js 20 Alpine для минимального размера образа
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт (Railway автоматически установит переменную PORT)
EXPOSE 3001

# Применяем миграции базы данных при старте
# и запускаем приложение
CMD npm run db:push && node dist/index.js
