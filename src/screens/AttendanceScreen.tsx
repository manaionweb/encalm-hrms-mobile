import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Clock, Calendar, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import tw from 'twrnc';

export default function AttendanceScreen({ route, navigation }: any) {
    const targetUserId = route.params?.id; // If passed, view specific user attendance (Admin view)
    const isSelf = !targetUserId;

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPunchedIn, setIsPunchedIn] = useState(false);
    const [punchInTime, setPunchInTime] = useState<any>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0
    });
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

    // Regularization State
    const [regularizeDate, setRegularizeDate] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [inInputText, setInInputText] = useState('09:00 AM');
    const [outInputText, setOutInputText] = useState('06:00 PM');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStatusAndPolicy = async () => {
        if (!isSelf) return;
        try {
            const res = await api.get('/attendance/status');
            setIsPunchedIn(res.data.isPunchedIn);
            if (res.data.punchInTime) setPunchInTime(new Date(res.data.punchInTime));
        } catch (error) {
            console.error("Failed to fetch initial status:", error);
        }
    };

    const fetchHistoryAndStats = async () => {
        setLoading(true);
        try {
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth() + 1;
            const employeeQuery = targetUserId
                ? `&employeeId=${targetUserId}`
                : '';

            // Fetch history
            const historyRes = await api.get(
                `/attendance/history?year=${year}&month=${month}${employeeQuery}`
            );
            setAttendanceHistory(historyRes.data || []);

            // Fetch stats
            const statsRes = await api.get(
                `/attendance/stats?year=${year}&month=${month}${employeeQuery}`
            );
            setStats({
                present: statsRes.data.present || 0,
                absent: statsRes.data.absent || 0,
                late: statsRes.data.late || 0,
                holiday: statsRes.data.holiday || 0
            });
        } catch (error) {
            console.error("Failed to fetch attendance history/stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatusAndPolicy();
    }, [isSelf]);

    useEffect(() => {
        fetchHistoryAndStats();
    }, [selectedMonth, targetUserId]);

    const handlePunch = async () => {
        try {
            const res = await api.post('/attendance/punch');
            Alert.alert("Attendance Update", res.data.message || 'Action completed successfully');
            fetchStatusAndPolicy();
            fetchHistoryAndStats();
        } catch (error: any) {
            Alert.alert("Punch Failed", error.response?.data?.message || 'Error occurred during punch');
        }
    };

    const submitRegularization = async () => {
        if (!reason.trim()) {
            Alert.alert("Required", "Please provide a reason for regularization.");
            return;
        }

        setSubmittingRequest(true);
        try {
            const payload = {
                date: regularizeDate,
                inTime: inInputText,
                outTime: outInputText,
                reason: reason.trim(),
            };

            await api.post('/attendance/regularize', payload);
            Alert.alert("Success", "Regularization request submitted!");
            setRegularizeDate(null);
            setReason('');
            setInInputText('09:00 AM');
            setOutInputText('06:00 PM');
            fetchHistoryAndStats();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to submit request.");
        } finally {
            setSubmittingRequest(false);
        }
    };

    const formatTime = (time: any) => {
        if (!time) return '--:--';

        return new Date(time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const changeMonth = (direction: 'next' | 'prev') => {
        const nextMonth = new Date(selectedMonth);
        nextMonth.setMonth(selectedMonth.getMonth() + (direction === 'next' ? 1 : -1));
        setSelectedMonth(nextMonth);
    };

    return (
        <View style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}>

            <CustomHeader navigation={navigation} title="Attendance Logs" />

            <ScrollView style={tw`flex-1 px-4 pt-4`} contentContainerStyle={tw`pb-12`}>

                {/* Real-time Punch Card */}
                {isSelf && (
                    <View style={tw`bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm mb-6 items-center`}>
                        <Clock size={32} color="#6366f1" />
                        <Text style={tw`text-2xl font-bold text-gray-800 dark:text-white mt-2`}>
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </Text>
                        <Text style={tw`text-xs text-gray-400 mt-1`}>
                            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>

                        <TouchableOpacity
                            onPress={handlePunch}
                            style={[
                                tw`px-8 py-3 rounded-full mt-4 flex-row items-center gap-2 shadow-md`,
                                { backgroundColor: isPunchedIn ? '#ef4444' : '#22c55e' }
                            ]}
                        >
                            <Text style={tw`text-white font-bold`}>{isPunchedIn ? 'Punch Out' : 'Punch In'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Stats View */}
                <View style={tw`flex-row justify-between mb-6`}>
                    {[
                        { label: 'Present', val: stats.present, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Absent', val: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: 'Late', val: stats.late, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Holiday', val: stats.holiday, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map((s, idx) => (
                        <View key={idx} style={tw`w-[23%] bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 items-center`}>
                            <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>{s.label}</Text>
                            <Text style={tw`text-lg font-black text-gray-900 dark:text-white mt-1`}>{s.val}</Text>
                        </View>
                    ))}
                </View>

                {/* Month Controller */}
                <View style={tw`flex-row justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl mb-4 border border-gray-150 dark:border-slate-700`}>
                    <TouchableOpacity onPress={() => changeMonth('prev')} style={tw`p-1`}>
                        <ChevronLeft size={20} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={tw`text-sm font-bold text-gray-800 dark:text-white`}>
                        {selectedMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeMonth('next')} style={tw`p-1`}>
                        <ChevronRight size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Daily Logs History */}
                <View style={tw`bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-4`}>
                    <Text style={tw`font-bold text-gray-900 dark:text-white text-sm mb-4`}>Daily Attendance Records</Text>

                    {loading ? (
                        <ActivityIndicator size="small" color="#6366f1" style={tw`py-10`} />
                    ) : (
                        attendanceHistory.map((log, index) => {
                            const dateObj = new Date(log.date);
                            const dayStr = dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' });
                            const weekdayStr = dateObj.toLocaleDateString([], { weekday: 'short' });

                            return (
                                <View key={index} style={tw`flex-row justify-between items-center py-3 border-b border-gray-50 dark:border-slate-700 last:border-0`}>
                                    <View>
                                        <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>{dayStr} ({weekdayStr})</Text>
                                        <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                            {formatTime(log.inTime)} - {formatTime(log.outTime)}
                                        </Text>
                                    </View>
                                    <View style={tw`flex-row items-center gap-3`}>
                                        {/* <View style={tw`px-2.5 py-0.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-500/20 rounded-full`}>
                                            <Text style={tw`text-[9px] font-bold text-green-600 dark:text-green-400`}>{log.status}</Text>
                                        </View> */}
                                        <View
                                            style={[
                                                tw`px-2.5 py-0.5 rounded-full`,
                                                {
                                                    backgroundColor:
                                                        log.status === 'Present'
                                                            ? '#DCFCE7'
                                                            : log.status === 'Late'
                                                                ? '#FEF3C7'
                                                                : log.status === 'Absent'
                                                                    ? '#FEE2E2'
                                                                    : log.status === 'Holiday'
                                                                        ? '#DBEAFE'
                                                                        : '#E5E7EB',
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: '700',
                                                    color:
                                                        log.status === 'Present'
                                                            ? '#16A34A'
                                                            : log.status === 'Late'
                                                                ? '#D97706'
                                                                : log.status === 'Absent'
                                                                    ? '#DC2626'
                                                                    : log.status === 'Holiday'
                                                                        ? '#2563EB'
                                                                        : '#374151',
                                                }}
                                            >
                                                {log.status}
                                            </Text>
                                        </View>
                                        {isSelf && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setRegularizeDate(log.date);

                                                    setInInputText(
                                                        log.inTime
                                                            ? formatTime(log.inTime)
                                                            : '09:00 AM'
                                                    );

                                                    setOutInputText(
                                                        log.outTime
                                                            ? formatTime(log.outTime)
                                                            : '06:00 PM'
                                                    );

                                                    setReason('');
                                                }}
                                                style={tw`bg-indigo-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl`}
                                            >
                                                <Text style={tw`text-[10px] font-bold text-indigo-600 dark:text-indigo-400`}>Correct</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

            </ScrollView>

            {/* Regularization Modal */}
            <Modal
                visible={!!regularizeDate}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRegularizeDate(null)}
            >
                <View style={tw`flex-1 justify-end bg-black/60`}>
                    <View style={tw`bg-white dark:bg-slate-800 p-6 rounded-t-3xl border-t border-gray-200 dark:border-slate-700`}>
                        <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-4`}>Attendance Correction ({regularizeDate})</Text>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Clock In Time (e.g. 09:00 AM)</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-800 dark:text-white`}
                                value={inInputText}
                                onChangeText={setInInputText}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Clock Out Time (e.g. 06:00 PM)</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-800 dark:text-white`}
                                value={outInputText}
                                onChangeText={setOutInputText}
                            />
                        </View>

                        <View style={tw`mb-6`}>
                            <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Reason for correction *</Text>
                            <TextInput
                                style={tw`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-650 rounded-xl text-gray-800 dark:text-white`}
                                placeholder="Forgot to punch / Client site work..."
                                placeholderTextColor="#cbd5e1"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>

                        <View style={tw`flex-row gap-4 mb-4`}>
                            <TouchableOpacity
                                onPress={() => {
                                    setRegularizeDate(null);
                                    setReason('');
                                    setInInputText('09:00 AM');
                                    setOutInputText('06:00 PM');
                                }}
                                style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 rounded-xl items-center`}
                            >
                                <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={submitRegularization}
                                disabled={submittingRequest}
                                style={tw`flex-1 py-3.5 bg-indigo-600 rounded-xl items-center`}
                            >
                                <Text style={tw`text-white font-bold`}>
                                    {submittingRequest ? 'Submitting...' : 'Submit'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
