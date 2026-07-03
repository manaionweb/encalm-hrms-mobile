import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Bell, Sun, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import tw from 'twrnc';

interface CustomHeaderProps {
    navigation: any;
    title: string;
}

export default function CustomHeader({ navigation, title }: CustomHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [unreadCount, setUnreadCount] = useState(0);
    const insets = useSafeAreaInsets();

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications');
            if (Array.isArray(res.data)) {
                const unread = res.data.filter((n: any) => n.unread).length;
                setUnreadCount(unread);
            }
        } catch (e) {
            console.error('Failed to get header notifications count:', e);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={[
            tw`flex-row items-center justify-between bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700`,
            {
                paddingTop: insets.top + 10,
                paddingHorizontal: 16,
                paddingBottom: 12,
            },

        ]}>

            {/* Left: Drawer Toggle */}
            <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={tw`p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl`}
            >
                <Menu size={20} color={isDark ? '#e2e8f0' : '#1e293b'} />
            </TouchableOpacity>

            {/* Center: Title */}
            <Text style={tw`text-base font-black text-gray-900 dark:text-white tracking-tight`}>
                {title}
            </Text>

            {/* Right: Actions */}
            <View style={tw`flex-row items-center gap-2`}>

                {/* Theme Toggle */}
                <TouchableOpacity
                    onPress={toggleTheme}
                    style={tw`p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl`}
                >
                    {isDark ? (
                        <Sun size={18} color="#e2e8f0" />
                    ) : (
                        <Moon size={18} color="#1e293b" />
                    )}
                </TouchableOpacity>

                {/* Notifications Bell */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    style={tw`p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl relative`}
                >
                    <Bell size={18} color={isDark ? '#e2e8f0' : '#1e293b'} />
                    {unreadCount > 0 && (
                        <View style={tw`absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 rounded-full items-center justify-center border-2 border-white dark:border-slate-800`}>
                            <Text style={tw`text-[7.5px] font-black text-white`}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

            </View>

        </View>
    );
}
