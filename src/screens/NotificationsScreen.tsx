import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Bell, Check, Trash2, Search, ArrowLeft, FileText, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import tw from 'twrnc';

export default function NotificationsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
        } catch (e) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
            Alert.alert('Success', 'All notifications marked as read.');
        } catch (e) {
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        }
    };

    const deleteSelected = async () => {
        if (selectedIds.length === 0) return;

        try {
            await api.post('/notifications/delete-bulk', { ids: selectedIds });
            setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
            setSelectedIds([]);
            Alert.alert('Success', 'Notifications deleted.');
        } catch (e) {
            setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
            setSelectedIds([]);
            Alert.alert('Success', 'Deleted successfully');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesTab = activeTab === 'all' || n.unread;
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const renderNotificationItem = ({ item }: { item: any }) => {
        const isSelected = selectedIds.includes(item.id);
        
        return (
            <TouchableOpacity 
                onPress={() => {
                    if (item.unread) markAsRead(item.id);
                }}
                style={tw`p-4 rounded-3xl mb-4 border ${
                    item.unread 
                        ? 'bg-white dark:bg-[#4c1d95] border-gray-150 dark:border-[#8b5cf6]/30' 
                        : 'bg-white/50 dark:bg-[#4c1d95]/40 border-gray-100 dark:border-[#8b5cf6]/30'
                } shadow-sm`}
            >
                <View style={tw`flex-row items-start`}>
                    {/* Checkbox */}
                    <TouchableOpacity 
                        onPress={() => toggleSelect(item.id)} 
                        style={tw`w-5 h-5 rounded border ${
                            isSelected 
                                ? 'bg-[#8b5cf6] border-[#8b5cf6]' 
                                : 'border-gray-300 dark:border-white/20'
                        } items-center justify-center mr-3 mt-1`}
                    >
                        {isSelected && <Check size={12} color="white" />}
                    </TouchableOpacity>

                    {/* Category Icon */}
                    <View style={tw`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 mt-0.5 ${
                        item.type === 'leave' ? 'bg-amber-100 dark:bg-amber-500/20' :
                        item.type === 'attendance' ? 'bg-rose-100 dark:bg-rose-500/20' :
                        'bg-[#f5f3ff] dark:bg-[#8b5cf6]/10'
                    }`}>
                        {item.type === 'leave' ? (
                            <FileText size={18} color={isDark ? '#fbbf24' : '#d97706'} />
                        ) : item.type === 'attendance' ? (
                            <Calendar size={18} color={isDark ? '#fb7185' : '#e11d48'} />
                        ) : (
                            <Bell size={18} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                        )}
                    </View>

                    {/* Content text */}
                    <View style={tw`flex-1`}>
                        <View style={tw`flex-row justify-between items-center mb-1`}>
                            <View style={tw`flex-row items-center gap-1.5 flex-1 mr-2`}>
                                <Text style={tw`font-bold text-sm text-gray-900 dark:text-white flex-shrink`} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {item.unread && (
                                    <View style={tw`w-1.5 h-1.5 rounded-full bg-[#8b5cf6]`} />
                                )}
                            </View>
                            {item.time && (
                                <Text style={tw`text-[10px] text-gray-400 dark:text-gray-500 font-medium`}>
                                    {item.time}
                                </Text>
                            )}
                        </View>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed`}>
                            {item.message || item.title}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            {/* Header */}
            <View style={[
                tw`flex-row items-center justify-between px-4 pb-4 bg-white dark:bg-[#0B0A1F] border-b border-gray-100 dark:border-white/5`,
                { paddingTop: insets.top + 16 }
            ]}>
                <View style={tw`flex-row items-center`}>
                    {navigation.canGoBack() && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                            <ArrowLeft size={20} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={tw`text-base font-black text-gray-900 dark:text-white`}>Notifications</Text>
                        <Text style={tw`text-[10px] text-gray-400 dark:text-gray-500 font-medium`}>Manage your system alerts and history</Text>
                    </View>
                </View>
                <View style={tw`flex-row gap-2`}>
                    {selectedIds.length > 0 && (
                        <TouchableOpacity onPress={deleteSelected} style={tw`p-2`}>
                            <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={markAllRead} style={tw`p-2`}>
                        <Check size={20} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Tabs & Select All */}
            <View style={tw`flex-row bg-[#f5f3ff] dark:bg-[#0B0A1F] px-4 py-3 border-b border-gray-100 dark:border-white/5 justify-between items-center`}>
                <View style={tw`flex-row bg-gray-200/50 dark:bg-white/5 p-1 rounded-xl w-36`}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('all')}
                        style={tw`flex-1 py-1.5 items-center rounded-lg ${activeTab === 'all' ? 'bg-white dark:bg-[#8b5cf6] shadow-sm' : ''}`}
                    >
                        <Text style={tw`text-[10px] font-bold ${activeTab === 'all' ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('unread')}
                        style={tw`flex-1 py-1.5 items-center rounded-lg ${activeTab === 'unread' ? 'bg-white dark:bg-[#8b5cf6] shadow-sm' : ''}`}
                    >
                        <Text style={tw`text-[10px] font-bold ${activeTab === 'unread' ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Unread</Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                    onPress={toggleSelectAll}
                    style={tw`px-3 py-1.5 bg-white dark:bg-[#4c1d95] border border-gray-100 dark:border-[#8b5cf6]/30 rounded-xl shadow-sm`}
                >
                    <Text style={tw`text-[10px] font-bold text-gray-700 dark:text-gray-300`}>
                        {selectedIds.length > 0 && selectedIds.length === filteredNotifications.length ? "Deselect All" : "Select All"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={tw`px-4 pt-4`}>
                <View style={tw`flex-row items-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                    <Search size={18} color={isDark ? '#c4b5fd' : '#8b5cf6'} style={tw`mr-2`} />
                    <TextInput
                        style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                        placeholder="Search through alerts..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={tw`flex-1 justify-center`}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : filteredNotifications.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Bell size={48} color={isDark ? '#2e2b5c' : '#cbd5e1'} style={tw`mb-4`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>All Clear!</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>You don't have any notifications right now.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotificationItem}
                    contentContainerStyle={tw`px-4 pb-8`}
                />
            )}

        </View>
    );
}
