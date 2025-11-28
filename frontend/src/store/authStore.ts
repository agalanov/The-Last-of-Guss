import { create } from 'zustand';
import { User } from '../api/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

// Store для управления состоянием аутентификации
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
    }),

    logout: () => set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
    }),
}));
