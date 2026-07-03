import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        // Load theme from async storage on boot
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setThemeState(savedTheme);
                }
            } catch (e) {
                console.error('Failed to load theme', e);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(nextTheme);
        try {
            await AsyncStorage.setItem('theme', nextTheme);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('theme', newTheme);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
