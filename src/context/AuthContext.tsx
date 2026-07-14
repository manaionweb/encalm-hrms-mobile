import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthFailureCallback } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = "HR_ADMIN" | "EMPLOYEE" | "SYSTEM_ADMIN" | "MANAGER";

interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
    token?: string;
    accessibleModules?: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize from Async Storage to persist login across sessions
    useEffect(() => {
        // Register auth failure callback to reset context state when session expires
        setAuthFailureCallback(() => {
            setUser(null);
        });

        const checkSession = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('encalm_user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Error checking session", e);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const res = await api.post('/auth/login', { email, password });
            const data = res.data;

            const { token, refreshToken, user: userData } = data;

            setUser(userData);
            
            await AsyncStorage.setItem('encalm_user', JSON.stringify(userData));
            await AsyncStorage.setItem('token', token);
            if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
            }
            if (userData?.tenantId) {
                await AsyncStorage.setItem('tenantId', userData.tenantId);
            }

            // Note: FCM Push notification configuration can be added here
            // e.g. request FCM token and save to backend.
            try {
                // Mock FCM/Push Registration or placeholder
                // We'll invoke it if the native push notification module is configured.
            } catch (fcmError) {
                console.log("Push notification registration skipped or failed", fcmError);
            }

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Login failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Remove FCM token from backend before clearing token
            await api.delete("/push-notification/remove-token");
        } catch (error) {
            console.log("Failed to remove FCM token:", error);
        }
        setUser(null);
        await AsyncStorage.removeItem('encalm_user');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('tenantId');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
