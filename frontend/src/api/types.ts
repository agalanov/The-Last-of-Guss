// Типы для пользователя
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'nikita' | 'survivor';
}

// Типы для раунда
export interface Round {
    id: string;
    startTime: string;
    endTime: string;
    totalScore: number;
    winnerId: string | null;
    createdAt: string;
}

// Состояние раунда
export type RoundState = 'cooldown' | 'active' | 'finished';

// Детали раунда
export interface RoundDetails {
    round: Round;
    state: RoundState;
    winner: {
        username: string;
        score: number;
    } | null;
    playerScore: number;
    playerTaps: number;
}

// Ответ на логин
export interface LoginResponse {
    user: User;
}

// Ответ на получение списка раундов
export interface RoundsResponse {
    rounds: Round[];
}

// Ответ на тап
export interface TapResponse {
    score: number;
    taps: number;
}
