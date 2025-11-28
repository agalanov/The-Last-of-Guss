import axios from 'axios';

// Получаем базовый URL из переменных окружения или используем относительный путь
const getBaseURL = () => {
    // В production используем переменную окружения VITE_API_URL
    // Если указан полный URL, используем его (должен включать /api в конце)
    // Если не указан, используем относительный путь для development
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        // Если URL уже содержит /api, используем как есть, иначе добавляем
        return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    }
    // В development используем относительный путь (работает с proxy в vite.config.ts)
    return '/api';
};

// Создаем инстанс axios с настройками
export const apiClient = axios.create({
    baseURL: getBaseURL(),
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
