import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { Check, X, Search, Calendar, Clock } from 'lucide-react-native';
import tw from 'twrnc';
import useRegularizations from "../hooks/useRegularizations";
import { useToast } from '../context/ToastContext';
import CustomHeader from '../components/CustomHeader';

export default function RegularizationsScreen({ navigation }: any) {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const {
        loading,
        refreshing,
        requests,
        submitting,
        approve,
        reject,
        refresh,
    } = useRegularizations();

    const formatTime12h = (timeStr?: string) => {
        if (!timeStr) return '--:--';
        const trimmed = timeStr.trim();
        if (/^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(trimmed)) {
            return trimmed;
        }
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
            const [hoursStr, minutesStr] = trimmed.split(':');
            let hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
            return `${hours}:${minutesFormatted} ${ampm}`;
        }
        try {
            const date = new Date(trimmed);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            }
        } catch (e) {}
        return timeStr;
    };

    const handleApprove = async (id: string) => {
        try {
            await approve(id);
            showToast("Attendance correction approved successfully.", 'success');
        } catch (err: any) {
            showToast(err.message || "Failed to approve regularization", 'error');
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectingId || !rejectComment.trim()) {
            showToast("Please enter a rejection reason.", 'error');
            return;
        }

        try {
            await reject(
                rejectingId,
                rejectComment
            );
            showToast("Attendance correction rejected.", 'success');
            setRejectComment("");
            setRejectingId(null);
        } catch (err: any) {
            showToast(err.message || "Failed to reject regularization", 'error');
        }
    };

    const filteredRequests = requests.filter(req => {
        const name = req.user?.name || '';
        const reason = req.reason || '';
        const title = req.user?.employeeProfile?.title || '';

        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
            title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>

            {/* Custom Header */}
            <CustomHeader navigation={navigation} title="Attendance Corrections" showBackButton={true} />

            {/* Search Bar */}
            <View style={tw`px-4 pt-4`}>
                <View style={tw`flex-row items-center bg-white dark:bg-[#311768] border border-gray-100 dark:border-[#6d28d9]/40 rounded-2xl px-3 py-1 mb-4 shadow-sm`}>
                    <Search size={18} color="#a78bfa" style={tw`mr-2`} />
                    <TextInput
                        style={tw`flex-1 text-sm text-gray-800 dark:text-white h-10 font-semibold`}
                        placeholder="Search by name, role or reason..."
                        placeholderTextColor="#a78bfa/50"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : filteredRequests.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center p-6`}>
                    <Calendar size={48} color="#cbd5e1" style={tw`mb-4 opacity-50`} />
                    <Text style={tw`text-base font-bold text-gray-700 dark:text-white`}>No Pending Corrections</Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>All requests have been processed successfully.</Text>
                </View>
            ) : (
                <ScrollView
                    style={tw`flex-1 px-4`}
                    contentContainerStyle={tw`pb-8`}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                        />
                    }
                >
                    {filteredRequests.map((req, index) => {
                        const name = req.user?.name || `Employee #${req.userId}`;
                        const title = (req.user as any)?.employeeProfile?.title || 'Employee';
                        const department = (req.user as any)?.employeeProfile?.department || 'IT';
                        const initials = name ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?';
                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                        const avatarBg = colors[index % colors.length];

                        const proposedInFormatted = formatTime12h((req as any).proposedIn || (req as any).inTime);
                        const proposedOutFormatted = formatTime12h((req as any).proposedOut || (req as any).outTime);

                        return (
                            <View
                                key={req.id}
                                style={tw`bg-white dark:bg-[#311768] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-[#6d28d9]/40 shadow-lg`}
                            >
                                {/* Row Header: User details & Date */}
                                <View style={tw`flex-row justify-between items-center mb-3`}>
                                    <View style={tw`flex-row items-center gap-3 flex-1`}>
                                        <View style={tw`w-10 h-10 rounded-2xl ${avatarBg} items-center justify-center shadow-md`}>
                                            <Text style={tw`text-white font-bold text-sm`}>{initials}</Text>
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{name}</Text>
                                            <Text style={tw`text-[10px] text-gray-400 dark:text-purple-200/70 font-bold uppercase tracking-wider`}>
                                                {title} • {department}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tw`items-end`}>
                                        <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{req.date}</Text>
                                    </View>
                                </View>

                                {/* Times & Action Buttons Row (Matching Web App UI) */}
                                <View style={tw`flex-row justify-between items-center bg-gray-50 dark:bg-[#230d4b] p-3 rounded-2xl mb-3 border border-gray-100 dark:border-[#6d28d9]/20`}>
                                    <View style={tw`space-y-1`}>
                                        {!!proposedInFormatted && (
                                            <View style={tw`flex-row items-center gap-1.5`}>
                                                <Clock size={13} color="#22c55e" />
                                                <Text style={tw`text-xs font-bold text-emerald-600 dark:text-[#4ade80]`}>
                                                    In: {proposedInFormatted}
                                                </Text>
                                            </View>
                                        )}
                                        {!!proposedOutFormatted && (
                                            <View style={tw`flex-row items-center gap-1.5 mt-1`}>
                                                <Clock size={13} color="#f43f5e" />
                                                <Text style={tw`text-xs font-bold text-rose-500 dark:text-[#fb7185]`}>
                                                    Out: {proposedOutFormatted}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Action Buttons: Green Check and Red Cross icons matching Web App */}
                                    <View style={tw`flex-row gap-2.5`}>
                                        <TouchableOpacity
                                            onPress={() => handleApprove(req.id)}
                                            activeOpacity={0.8}
                                            style={tw`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md active:scale-95`}
                                        >
                                            <Check size={20} color="#16a34a" strokeWidth={2.5} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                setRejectingId(req.id);
                                                setRejectComment('');
                                            }}
                                            activeOpacity={0.8}
                                            style={tw`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md active:scale-95`}
                                        >
                                            <X size={20} color="#dc2626" strokeWidth={2.5} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Reason */}
                                <Text style={tw`text-xs text-gray-600 dark:text-purple-200/80 italic px-1`}>
                                    "{req.reason}"
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Rejection Comment Modal */}
            <Modal
                visible={!!rejectingId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setRejectingId(null)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black/70 px-4`}>
                    <View style={tw`bg-white dark:bg-[#311768] p-6 rounded-[2rem] border border-gray-200 dark:border-[#6d28d9]/40 w-full max-w-md shadow-2xl`}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Reject Request</Text>
                            <TouchableOpacity onPress={() => setRejectingId(null)} style={tw`p-1.5 bg-white/10 rounded-full`}>
                                <X size={18} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={tw`text-xs text-gray-500 dark:text-purple-200/70 mb-4 font-medium`}>
                            Please provide a reason for rejecting this regularization request.
                        </Text>

                        <TextInput
                            style={tw`w-full px-4 py-3 bg-[#f5f3ff] dark:bg-[#230d4b] border border-gray-300 dark:border-[#6d28d9]/30 rounded-2xl text-gray-800 dark:text-white min-h-24 mb-6 font-semibold text-sm`}
                            placeholder="Enter rejection reason..."
                            placeholderTextColor="#a78bfa/50"
                            multiline={true}
                            textAlignVertical="top"
                            value={rejectComment}
                            onChangeText={setRejectComment}
                        />

                        <View style={tw`flex-row gap-3`}>
                            <TouchableOpacity
                                onPress={() => setRejectingId(null)}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#230d4b] border border-[#6d28d9]/30 rounded-2xl items-center`}
                            >
                                <Text style={tw`text-gray-600 dark:text-white font-bold text-xs uppercase tracking-wider`}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleRejectSubmit}
                                disabled={submitting}
                                style={tw`flex-1 py-3.5 bg-rose-500 rounded-2xl items-center shadow-lg shadow-rose-500/25`}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={tw`text-white font-bold text-xs uppercase tracking-wider`}>Reject</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}


