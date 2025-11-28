import axios from 'axios';

// Создаем инстанс axios с настройками
export const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true, // Отправляем cookies с каждым запросом
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Если получили 401, перенаправляем на страницу логина
        // Но только если это не проверка аутентификации (чтобы избежать бесконечного цикла)
        if (error.response?.status === 401 && !error.config.url?.includes('/auth/me')) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
