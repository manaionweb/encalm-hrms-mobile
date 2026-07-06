import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const colorScheme = Appearance.getColorScheme();
        return colorScheme === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        // Load theme from async storage on boot
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setThemeState(savedTheme);
                    (tw as any).setColorScheme(savedTheme);
                } else {
                    const systemScheme = Appearance.getColorScheme();
                    const initialTheme = systemScheme === 'dark' ? 'dark' : 'light';
                    setThemeState(initialTheme);
                    (tw as any).setColorScheme(initialTheme);
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
        (tw as any).setColorScheme(nextTheme);
        try {
            await AsyncStorage.setItem('theme', nextTheme);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        (tw as any).setColorScheme(newTheme);
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
