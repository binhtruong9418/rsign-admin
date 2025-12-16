import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest } from '@/types';
import { storage } from '@/lib/utils';
import { authAPI } from '@/lib/api';
import { JWT_STORAGE_KEY, USER_STORAGE_KEY } from '@/lib/constant';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const token = storage.get<string>(JWT_STORAGE_KEY);
        const savedUser = storage.get<User>(USER_STORAGE_KEY);

        if (token && savedUser) {
            setUser(savedUser);
        }

        setIsLoading(false);
    }, []);

    const login = async (credentials: LoginRequest): Promise<void> => {
        try {
            const response = await authAPI.login(credentials);

            // Store token and user data
            storage.set(JWT_STORAGE_KEY, response.token);
            storage.set(USER_STORAGE_KEY, response.user);

            setUser(response.user);
        } catch (error) {
            // Re-throw error to be handled by the login form
            throw new Error('Invalid credentials');
        }
    }; const logout = () => {
        storage.remove(JWT_STORAGE_KEY);
        storage.remove(USER_STORAGE_KEY);
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        storage.set('user', updatedUser);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}