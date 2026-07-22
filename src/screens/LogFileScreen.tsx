import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Search, RotateCcw, CheckCircle, XCircle, Edit3, Upload, Building2, Calendar, ChevronDown, X } from 'lucide-react-native';
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

const getStatusBadgeStyle = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('approved') || act.includes('success')) {
        return { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400' };
    }
    if (act.includes('rejected')) {
        return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' };
    }
    if (act.includes('updated')) {
        return { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300' };
    }
    if (act.includes('deleted')) {
        return { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400' };
    }
    if (act.includes('created') || act.includes('requested')) {
        return { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300' };
    }
    return { bg: 'bg-gray-100 dark:bg-white/10', text: 'text-gray-700 dark:text-gray-300' };
};

const getIconBoxClass = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('approved') || act.includes('success')) {
        return { bg: 'bg-green-100 dark:bg-green-500/20', iconColor: '#22c55e' };
    }
    if (act.includes('rejected')) {
        return { bg: 'bg-red-100 dark:bg-red-500/20', iconColor: '#ef4444' };
    }
    if (act.includes('updated')) {
        return { bg: 'bg-blue-100 dark:bg-blue-500/20', iconColor: '#3b82f6' };
    }
    if (act.includes('deleted')) {
        return { bg: 'bg-rose-100 dark:bg-rose-500/20', iconColor: '#f43f5e' };
    }
    return { bg: 'bg-purple-100 dark:bg-purple-500/20', iconColor: '#a855f7' };
};

const getIcon = (action: string, module: string) => {
    const act = action.toLowerCase();
    const mod = module.toLowerCase();
    const { iconColor } = getIconBoxClass(action);

    if (act.includes('approved')) return <CheckCircle size={18} color={iconColor} />;
    if (act.includes('rejected')) return <XCircle size={18} color={iconColor} />;
    if (mod.includes('signature')) return <Upload size={18} color={iconColor} />;
    if (mod.includes('department') || mod.includes('team')) return <Building2 size={18} color={iconColor} />;
    return <Edit3 size={18} color={iconColor} />;
};

const ACTION_MODULE_OPTIONS = [
    'All',
    'Regularization',
    'Attendance',
    'Leave',
    'Employee',
    'Team',
    'Salary',
    'Signature',
    'Department'
];

const STATUS_OPTIONS = [
    'All',
    'Approved',
    'Rejected',
    'Updated',
    'Created',
    'Deleted',
    'Requested'
];

export default function LogFileScreen({ navigation }: any) {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionType, setActionType] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modals
    const [showActionPicker, setShowActionPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<string | null>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/audit-logs');
            setLogs(res.data || []);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                log.module.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query) ||
                log.description.toLowerCase().includes(query) ||
                log.performedBy.toLowerCase().includes(query) ||
                (log.targetUser && log.targetUser.toLowerCase().includes(query));

            const matchesAction =
                actionType === 'All' ||
                log.module.toLowerCase().includes(actionType.toLowerCase());

            const matchesStatus =
                statusFilter === 'All' ||
                log.action.toLowerCase().includes(statusFilter.toLowerCase());

            return matchesSearch && matchesAction && matchesStatus;
        });
    }, [logs, searchQuery, actionType, statusFilter]);

    const resetFilters = () => {
        setSearchQuery('');
        setActionType('All');
        setStatusFilter('All');
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            <CustomHeader navigation={navigation} title="Log File" />

            <ScrollView style={tw`flex-1 px-4 pt-4`} contentContainerStyle={tw`pb-12`} showsVerticalScrollIndicator={false}>
                {/* Screen Title & Subtitle matching web */}
                <View style={tw`mb-4`}>
                    <Text style={tw`text-lg font-black text-gray-900 dark:text-white`}>Log File</Text>
                    <Text style={tw`text-xs text-gray-500 dark:text-purple-200 mt-0.5`}>Track all admin and manager actions</Text>
                </View>

                {/* Filters Section matching web */}
                <View style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl p-4 border border-gray-100 dark:border-white/10 shadow-sm mb-4 gap-3`}>
                    {/* Search Input */}
                    <View style={tw`flex-row items-center bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-1.5`}>
                        <Search size={18} color="#94a3b8" style={tw`mr-2`} />
                        <TextInput
                            style={tw`flex-1 text-xs text-gray-800 dark:text-white h-9 font-bold`}
                            placeholder="Search logs by keyword..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filter Pickers Row */}
                    <View style={tw`flex-row gap-2`}>
                        {/* Action Module Picker */}
                        <TouchableOpacity
                            onPress={() => setShowActionPicker(true)}
                            style={tw`flex-1 flex-row items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl`}
                        >
                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`} numberOfLines={1}>
                                {actionType === 'All' ? 'Actions' : actionType}
                            </Text>
                            <ChevronDown size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Status Filter Picker */}
                        <TouchableOpacity
                            onPress={() => setShowStatusPicker(true)}
                            style={tw`flex-1 flex-row items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl`}
                        >
                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`} numberOfLines={1}>
                                {statusFilter === 'All' ? 'Status' : statusFilter}
                            </Text>
                            <ChevronDown size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Reset Filters */}
                        <TouchableOpacity
                            onPress={resetFilters}
                            style={tw`px-3.5 py-2.5 bg-gray-50 dark:bg-white/10 rounded-2xl flex-row items-center justify-center gap-1 border border-gray-200 dark:border-white/10`}
                        >
                            <RotateCcw size={14} color="#a78bfa" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logs Content List */}
                {loading ? (
                    <View style={tw`py-12 items-center justify-center`}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                    </View>
                ) : filteredLogs.length === 0 ? (
                    <View style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl p-8 items-center justify-center border border-gray-100 dark:border-white/5`}>
                        <Calendar size={40} color="#94a3b8" style={tw`mb-3`} />
                        <Text style={tw`text-base font-bold text-gray-800 dark:text-white`}>No logs found</Text>
                        <Text style={tw`text-xs text-gray-400 mt-1 text-center`}>Try adjusting your search filters.</Text>
                    </View>
                ) : (
                    <View style={tw`gap-3`}>
                        {filteredLogs.map((log) => {
                            const badgeStyle = getStatusBadgeStyle(log.action);
                            const boxStyle = getIconBoxClass(log.action);

                            return (
                                <View
                                    key={log.id}
                                    style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl p-4 border border-gray-100 dark:border-white/5 shadow-sm`}
                                >
                                    {/* Action Header + Status Badge */}
                                    <View style={tw`flex-row justify-between items-center mb-3`}>
                                        <View style={tw`flex-row items-center gap-2.5 flex-1 mr-2`}>
                                            <View style={tw`w-9 h-9 rounded-xl ${boxStyle.bg} items-center justify-center`}>
                                                {getIcon(log.action, log.module)}
                                            </View>
                                            <Text style={tw`font-extrabold text-sm text-gray-900 dark:text-white flex-1`} numberOfLines={1}>
                                                {log.module} {log.action}
                                            </Text>
                                        </View>

                                        <View style={tw`px-2.5 py-1 ${badgeStyle.bg} rounded-xl`}>
                                            <Text style={tw`text-[10px] font-bold ${badgeStyle.text}`}>
                                                {log.action}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Entity & Performed By Grid */}
                                    <View style={tw`bg-gray-50 dark:bg-white/5 p-3 rounded-2xl gap-1.5 mb-3 border border-gray-100 dark:border-white/5`}>
                                        <View style={tw`flex-row justify-between items-center`}>
                                            <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>PERFORMED BY</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{log.performedBy || 'System'}</Text>
                                        </View>
                                        <View style={tw`flex-row justify-between items-center`}>
                                            <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>EMPLOYEE / ENTITY</Text>
                                            <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{log.targetUser || '—'}</Text>
                                        </View>
                                        <View style={tw`flex-row justify-between items-center`}>
                                            <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>DATE & TIME</Text>
                                            <View style={tw`flex-row items-center gap-1`}>
                                                <Calendar size={12} color="#94a3b8" />
                                                <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{log.dateTime}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Description (Clickable to view full modal) */}
                                    <TouchableOpacity
                                        onPress={() => setSelectedDescription(log.description)}
                                        style={tw`py-1`}
                                    >
                                        <Text style={tw`text-xs text-gray-600 dark:text-gray-300 italic`} numberOfLines={2}>
                                            "{log.description || '—'}"
                                        </Text>
                                        <Text style={tw`text-[10px] font-bold text-[#8b5cf6] dark:text-purple-300 mt-1`}>
                                            Click to view full description
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Action Module Picker Modal */}
            <Modal visible={showActionPicker} transparent animationType="fade" onRequestClose={() => setShowActionPicker(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setShowActionPicker(false)} style={tw`flex-1 bg-black/60 justify-end`}>
                    <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                        <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                            <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>Select Action Module</Text>
                            <TouchableOpacity onPress={() => setShowActionPicker(false)}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={tw`max-h-80`}>
                            {ACTION_MODULE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => {
                                        setActionType(opt);
                                        setShowActionPicker(false);
                                    }}
                                    style={tw`py-3 px-4 rounded-xl mb-1.5 ${actionType === opt ? 'bg-[#8b5cf6]/10' : 'bg-gray-50 dark:bg-white/5'}`}
                                >
                                    <Text style={tw`text-xs font-bold ${actionType === opt ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'}`}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Status Filter Picker Modal */}
            <Modal visible={showStatusPicker} transparent animationType="fade" onRequestClose={() => setShowStatusPicker(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setShowStatusPicker(false)} style={tw`flex-1 bg-black/60 justify-end`}>
                    <View style={tw`bg-white dark:bg-[#0B0A1F] rounded-t-3xl p-5 max-h-[60%]`}>
                        <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-white/10`}>
                            <Text style={tw`text-base font-bold text-gray-900 dark:text-white`}>Select Status Filter</Text>
                            <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={tw`max-h-80`}>
                            {STATUS_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => {
                                        setStatusFilter(opt);
                                        setShowStatusPicker(false);
                                    }}
                                    style={tw`py-3 px-4 rounded-xl mb-1.5 ${statusFilter === opt ? 'bg-[#8b5cf6]/10' : 'bg-gray-50 dark:bg-white/5'}`}
                                >
                                    <Text style={tw`text-xs font-bold ${statusFilter === opt ? 'text-[#8b5cf6]' : 'text-gray-800 dark:text-white'}`}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Description Popup Modal matching Web FE */}
            <Modal visible={selectedDescription !== null} transparent animationType="fade" onRequestClose={() => setSelectedDescription(null)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setSelectedDescription(null)} style={tw`flex-1 bg-black/70 justify-center px-5`}>
                    <TouchableOpacity activeOpacity={1} style={tw`bg-[#2e1065] border border-purple-500/30 rounded-3xl p-5 shadow-2xl`}>
                        <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-white/10`}>
                            <Text style={tw`text-lg font-black text-white`}>Description</Text>
                            <TouchableOpacity onPress={() => setSelectedDescription(null)}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View style={tw`bg-white/5 p-4 rounded-2xl border border-white/5 max-h-80`}>
                            <ScrollView nestedScrollEnabled>
                                <Text style={tw`text-xs text-purple-100 font-medium leading-relaxed`}>
                                    {selectedDescription}
                                </Text>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
