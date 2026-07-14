import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Search, Calendar } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import tw from 'twrnc';

type LogItem = {
  id: number;
  dateTime: string;
  module: string;
  action: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  targetUser: string;
  targetUserRole: string;
};

const getActionStyle = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('requested')) {
        return { bg: 'bg-white', text: 'text-gray-800' };
    } else if (act.includes('rejected') || act.includes('failed') || act.includes('deleted')) {
        return { bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400' };
    } else if (act.includes('approved') || act.includes('success')) {
        return { bg: 'bg-green-100 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-400' };
    } else {
        // Updated / default
        return { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' };
    }
};

export default function LogFileScreen({ navigation }: any) {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/audit-logs');
            setLogs(res.data || []);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter((log) => {
        const query = searchQuery.toLowerCase();
        return log.module.toLowerCase().includes(query) ||
               log.action.toLowerCase().includes(query) ||
               log.description.toLowerCase().includes(query) ||
               log.performedBy.toLowerCase().includes(query) ||
               log.targetUser.toLowerCase().includes(query);
    });

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            <CustomHeader navigation={navigation} title="Log File" />

            {/* Search */}
            <View style={tw`px-4 pt-4`}>
                <View style={tw`flex-row items-center bg-white dark:bg-[#4c1d95] border border-gray-100 dark:border-white/5 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                    <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                    <TextInput
                        style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10`}
                        placeholder="Search system logs..."
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
            ) : filteredLogs.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Calendar size={48} color="#cbd5e1" style={tw`mb-4`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>No Logs Recorded</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>All system triggers are empty.</Text>
                </View>
            ) : (
                <ScrollView style={tw`flex-1 px-4`} contentContainerStyle={tw`pb-8`} showsVerticalScrollIndicator={false}>
                    <View style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl border border-gray-100 dark:border-white/5 p-4 shadow-sm`}>
                        {filteredLogs.map((item, idx) => {
                            const isLast = idx === filteredLogs.length - 1;
                            const actionStyle = getActionStyle(item.action);
                            return (
                                <View key={item.id} style={tw`py-4 ${isLast ? '' : 'border-b border-gray-100 dark:border-white/5'}`}>
                                    <View style={tw`flex-row justify-between items-start mb-2.5`}>
                                        <View style={tw`flex-row items-center gap-1.5`}>
                                            <View style={tw`px-2.5 py-0.5 bg-[#f5f3ff]/20 dark:bg-white/10 rounded-full`}>
                                                <Text style={tw`text-[10px] font-bold text-[#8b5cf6] dark:text-purple-200 uppercase`}>
                                                    {item.module}
                                                </Text>
                                            </View>
                                            <View style={tw`px-2.5 py-0.5 ${actionStyle.bg} rounded-full`}>
                                                <Text style={tw`text-[9px] font-bold ${actionStyle.text}`}>
                                                    {item.action}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={tw`text-[10px] text-gray-400 dark:text-gray-300`}>{item.dateTime}</Text>
                                    </View>

                                    <Text style={tw`text-xs text-gray-700 dark:text-white leading-relaxed font-semibold mb-3`}>
                                        {item.description}
                                    </Text>

                                    <View style={tw`flex-row justify-between items-center pt-3 border-t border-gray-50 dark:border-white/5`}>
                                        <Text style={tw`text-[10px] text-gray-400 dark:text-gray-300`}>
                                            By: <Text style={tw`font-bold text-gray-600 dark:text-white`}>{item.performedBy} ({item.performedByRole})</Text>
                                        </Text>
                                        {item.targetUser ? (
                                            <Text style={tw`text-[10px] text-gray-400 dark:text-gray-300`}>
                                                Target: <Text style={tw`font-bold text-gray-600 dark:text-white`}>{item.targetUser}</Text>
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

        </View>
    );
}
