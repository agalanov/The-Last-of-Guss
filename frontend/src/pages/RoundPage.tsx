import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    AppBar,
    Toolbar,
    Divider,
} from '@mui/material';
import { apiClient } from '../api/client';
import { RoundDetails, RoundState } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { GooseImage } from '../components/GooseImage';

export const RoundPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [details, setDetails] = useState<RoundDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    const { user } = useAuthStore();

    // Загрузка деталей раунда
    useEffect(() => {
        if (id) {
            loadRoundDetails();
        }
    }, [id]);

    // Обновление таймера каждую секунду
    useEffect(() => {
        const interval = setInterval(() => {
            if (details) {
                updateTimeLeft(details.state, details.round);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [details]);

    const loadRoundDetails = async () => {
        try {
            const response = await apiClient.get<RoundDetails>(`/rounds/${id}`);
            setDetails(response.data);
            updateTimeLeft(response.data.state, response.data.round);
        } catch (error) {
            console.error('Ошибка при загрузке деталей раунда:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTimeLeft = (state: RoundState, round: any) => {
        const now = new Date();

        if (state === 'cooldown') {
            const startTime = new Date(round.startTime);
            const diff = Math.max(0, Math.floor((startTime.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);
        } else if (state === 'active') {
            const endTime = new Date(round.endTime);
            const diff = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);
        }
    };

    // Обработка тапа
    const handleTap = async () => {
        if (!details || details.state !== 'active') return;

        try {
            const response = await apiClient.post(`/rounds/${id}/tap`);

            // Обновляем локальное состояние
            setDetails({
                ...details,
                playerScore: response.data.score,
                playerTaps: response.data.taps,
            });
        } catch (error) {
            console.error('Ошибка при тапе:', error);
        }
    };

    // Форматирование времени (MM:SS)
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Получение текста статуса
    const getStatusText = (): string => {
        if (!details) return '';

        switch (details.state) {
            case 'cooldown':
                return 'Cooldown';
            case 'active':
                return 'Раунд активен!';
            case 'finished':
                return 'Раунд завершен';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <Container>
                <Typography variant="h5" sx={{ mt: 4 }}>
                    Загрузка...
                </Typography>
            </Container>
        );
    }

    if (!details) {
        return (
            <Container>
                <Typography variant="h5" sx={{ mt: 4 }}>
                    Раунд не найден
                </Typography>
            </Container>
        );
    }

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/rounds"
                        sx={{
                            flexGrow: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        {getStatusText()}
                    </Typography>
                    <Typography variant="body1">
                        {user?.username}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <GooseImage
                        onClick={handleTap}
                        disabled={details.state !== 'active'}
                    />

                    <Box sx={{ mt: 4, textAlign: 'center', width: '100%' }}>
                        <Typography variant="h5" gutterBottom>
                            {getStatusText()}
                        </Typography>

                        {details.state === 'cooldown' && (
                            <Typography variant="h6">
                                До начала раунда: {formatTime(timeLeft)}
                            </Typography>
                        )}

                        {details.state === 'active' && (
                            <>
                                <Typography variant="h6">
                                    До конца осталось: {formatTime(timeLeft)}
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    Мои очки - {details.playerScore}
                                </Typography>
                            </>
                        )}

                        {details.state === 'finished' && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body1">
                                    Всего: {details.round.totalScore}
                                </Typography>
                                {details.winner && (
                                    <Typography variant="body1">
                                        Победитель - {details.winner.username}: {details.winner.score}
                                    </Typography>
                                )}
                                <Typography variant="body1">
                                    Мои очки: {details.playerScore}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            </Container>
        </>
    );
};
