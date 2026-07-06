import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Bell, Sun, Moon, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import tw from 'twrnc';

interface CustomHeaderProps {
    navigation: any;
    title: string;
    showBackButton?: boolean;
}

export default function CustomHeader({ navigation, title, showBackButton }: CustomHeaderProps) {
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

    const canGoBack = showBackButton !== undefined 
        ? showBackButton 
        : (navigation && typeof navigation.canGoBack === 'function' ? navigation.canGoBack() : false);

    return (
        <View style={[
            tw`flex-row items-center justify-between bg-white dark:bg-[#0B0A1F] border-b border-gray-100 dark:border-white/5`,
            {
                paddingTop: insets.top + 10,
                paddingHorizontal: 16,
                paddingBottom: 12,
            },

        ]}>

            {/* Left: Drawer Toggle or Back Button */}
            {canGoBack ? (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={tw`p-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                >
                    <ArrowLeft size={20} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => navigation.openDrawer()}
                    style={tw`p-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                >
                    <Menu size={20} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                </TouchableOpacity>
            )}

            {/* Center: Title */}
            <Text style={tw`text-base font-black text-[#1e1b4b] dark:text-white tracking-tight`}>
                {title}
            </Text>

            {/* Right: Actions */}
            <View style={tw`flex-row items-center gap-2`}>

                {/* Theme Toggle */}
                <TouchableOpacity
                    onPress={toggleTheme}
                    style={tw`p-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                >
                    {isDark ? (
                        <Sun size={18} color="#c4b5fd" />
                    ) : (
                        <Moon size={18} color="#8b5cf6" />
                    )}
                </TouchableOpacity>

                {/* Notifications Bell */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    style={tw`p-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl relative shadow-sm`}
                >
                    <Bell size={18} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                    {unreadCount > 0 && (
                        <View style={tw`absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 rounded-full items-center justify-center border-2 border-white dark:border-[#0B0A1F]`}>
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
