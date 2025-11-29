# Production Dockerfile для фронтенда
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Production stage - используем nginx для раздачи статики
FROM nginx:alpine

# Копируем собранные файлы из builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx как шаблон
# Nginx автоматически обработает переменные через envsubst при старте
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Открываем порт (Railway автоматически установит переменную PORT)
# Используем переменную PORT или 80 по умолчанию
ENV PORT=80

EXPOSE 80

# Nginx автоматически обработает шаблон и запустится
# docker-entrypoint.sh обработает файлы в /etc/nginx/templates/


