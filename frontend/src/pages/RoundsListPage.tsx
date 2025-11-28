import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Divider,
    AppBar,
    Toolbar,
} from '@mui/material';
import { apiClient } from '../api/client';
import { Round, RoundsResponse } from '../api/types';
import { useAuthStore } from '../store/authStore';

export const RoundsListPage: React.FC = () => {
    const [rounds, setRounds] = useState<Round[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { user, isAdmin } = useAuthStore();

    // Загрузка списка раундов
    useEffect(() => {
        loadRounds();
    }, []);

    const loadRounds = async () => {
        try {
            const response = await apiClient.get<RoundsResponse>('/rounds');
            setRounds(response.data.rounds);
        } catch (error) {
            console.error('Ошибка при загрузке раундов:', error);
        } finally {
            setLoading(false);
        }
    };

    // Создание нового раунда
    const handleCreateRound = async () => {
        try {
            const response = await apiClient.post('/rounds');
            navigate(`/rounds/${response.data.round.id}`);
        } catch (error) {
            console.error('Ошибка при создании раунда:', error);
        }
    };

    // Определение статуса раунда
    const getRoundStatus = (round: Round): string => {
        const now = new Date();
        const startTime = new Date(round.startTime);
        const endTime = new Date(round.endTime);

        if (now < startTime) {
            return 'Cooldown';
        } else if (now >= startTime && now <= endTime) {
            return 'Активен';
        } else {
            return 'Завершен';
        }
    };

    // Форматирование даты
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
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

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Список РАУНДОВ
                    </Typography>
                    <Typography variant="body1">
                        {user?.username}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 4 }}>
                {isAdmin && (
                    <Box sx={{ mb: 3 }}>
                        <Button variant="contained" onClick={handleCreateRound}>
                            Создать раунд
                        </Button>
                    </Box>
                )}

                {rounds.length === 0 ? (
                    <Typography variant="body1">
                        Нет доступных раундов
                    </Typography>
                ) : (
                    rounds.map((round) => (
                        <Card key={round.id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    component={Link}
                                    to={`/rounds/${round.id}`}
                                    sx={{
                                        textDecoration: 'none',
                                        color: 'primary.main',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                        },
                                    }}
                                >
                                    ● Round ID: {round.id}
                                </Typography>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        Start: {formatDate(round.startTime)}
                                    </Typography>
                                    <Typography variant="body2">
                                        End: {formatDate(round.endTime)}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="body1">
                                    Статус: {getRoundStatus(round)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Container>
        </>
    );
};
