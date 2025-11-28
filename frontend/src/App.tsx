import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { LoginPage } from './pages/LoginPage';
import { RoundsListPage } from './pages/RoundsListPage';
import { RoundPage } from './pages/RoundPage';
import { useAuthStore } from './store/authStore';
import { apiClient } from './api/client';

// Создаем темную тему
const theme = createTheme({
    palette: {
        mode: 'dark',
    },
});

// Компонент для защищенных роутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    const setUser = useAuthStore((state) => state.setUser);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Проверяем аутентификацию при загрузке приложения
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await apiClient.get('/auth/me');
                setUser(response.data.user);
            } catch (error) {
                // Пользователь не аутентифицирован
                setUser(null);
            } finally {
                setIsAuthChecking(false);
            }
        };

        checkAuth();
    }, [setUser]);

    if (isAuthChecking) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        bgcolor: 'background.default',
                    }}
                >
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/rounds"
                        element={
                            <ProtectedRoute>
                                <RoundsListPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rounds/:id"
                        element={
                            <ProtectedRoute>
                                <RoundPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/rounds" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
