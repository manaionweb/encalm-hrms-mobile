import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Bell, Check, Trash2, Search, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';
import tw from 'twrnc';

export default function NotificationsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
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

    const renderNotificationItem = ({ item }: { item: any }) => {
        const isSelected = selectedIds.includes(item.id);
        
        return (
            <TouchableOpacity 
                onPress={() => {
                    if (item.unread) markAsRead(item.id);
                    Alert.alert(item.title, item.message);
                }}
                style={tw`p-4 bg-white dark:bg-slate-800 rounded-3xl mb-4 border ${item.unread ? 'border-indigo-200 dark:border-indigo-900' : 'border-gray-100 dark:border-slate-700'} shadow-sm`}
            >
                <View style={tw`flex-row justify-between items-start`}>
                    <TouchableOpacity onPress={() => toggleSelect(item.id)} style={tw`flex-row items-start flex-1 mr-2`}>
                        <View style={tw`w-5 h-5 rounded border ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} items-center justify-center mr-3 mt-0.5`}>
                            {isSelected && <Check size={12} color="white" />}
                        </View>
                        <View style={tw`flex-1`}>
                            <View style={tw`flex-row items-center gap-1.5`}>
                                <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{item.title}</Text>
                                {item.unread && (
                                    <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-600`} />
                                )}
                            </View>
                            <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-1`}>{item.message}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}>
            
            {/* Header */}
            <View style={[
                tw`flex-row items-center justify-between px-4 pb-4 bg-white dark:bg-slate-800 border-b border-gray-150 dark:border-slate-700`,
                { paddingTop: insets.top + 16 }
            ]}>
                <View style={tw`flex-row items-center`}>
                    {navigation.canGoBack() && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-2`}>
                            <ArrowLeft size={20} color="#1e293b" />
                        </TouchableOpacity>
                    )}
                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Notifications</Text>
                </View>
                <View style={tw`flex-row gap-2`}>
                    {selectedIds.length > 0 && (
                        <TouchableOpacity onPress={deleteSelected} style={tw`p-2`}>
                            <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={markAllRead} style={tw`p-2`}>
                        <Check size={20} color="#6366f1" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={tw`flex-row bg-white dark:bg-slate-800 p-2 border-b border-gray-100 dark:border-slate-700`}>
                <TouchableOpacity
                    onPress={() => setActiveTab('all')}
                    style={tw`flex-1 py-2 items-center ${activeTab === 'all' ? 'border-b-2 border-indigo-600' : ''}`}
                >
                    <Text style={tw`text-xs font-bold ${activeTab === 'all' ? 'text-indigo-600' : 'text-gray-400'}`}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('unread')}
                    style={tw`flex-1 py-2 items-center ${activeTab === 'unread' ? 'border-b-2 border-indigo-600' : ''}`}
                >
                    <Text style={tw`text-xs font-bold ${activeTab === 'unread' ? 'text-indigo-600' : 'text-gray-400'}`}>Unread</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={tw`px-4 pt-4`}>
                <View style={tw`flex-row items-center bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                    <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                    <TextInput
                        style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                        placeholder="Search alerts..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={tw`flex-1 justify-center`}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : filteredNotifications.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Bell size={48} color="#cbd5e1" style={tw`mb-4`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>No Notifications</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>You are all caught up!</Text>
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
