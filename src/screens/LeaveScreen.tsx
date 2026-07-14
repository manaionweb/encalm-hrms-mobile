import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Calendar, Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return dateString.includes('T') ? dateString.split('T')[0] : dateString;
};

const formatHistoryDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
    return cleanDateStr;
};

const getLeaveTypeStyle = (code: string) => {
    switch (code) {
        case 'EL': return { color: '#8b5cf6', fillClass: 'bg-[#8b5cf6]', bgClass: 'bg-purple-50 dark:bg-purple-950/20', badgeText: 'text-purple-700 dark:text-purple-300', badgeBg: 'bg-purple-100 dark:bg-purple-900/30' };
        case 'CL': return { color: '#3b82f6', fillClass: 'bg-[#3b82f6]', bgClass: 'bg-blue-50 dark:bg-blue-950/20', badgeText: 'text-blue-700 dark:text-blue-300', badgeBg: 'bg-blue-100 dark:bg-blue-900/30' };
        case 'SL': return { color: '#ec4899', fillClass: 'bg-[#ec4899]', bgClass: 'bg-pink-50 dark:bg-pink-950/20', badgeText: 'text-pink-700 dark:text-pink-300', badgeBg: 'bg-pink-100 dark:bg-pink-900/30' };
        default: return { color: '#6b7280', fillClass: 'bg-[#6b7280]', bgClass: 'bg-gray-50 dark:bg-white/10', badgeText: 'text-gray-700 dark:text-gray-300', badgeBg: 'bg-gray-100 dark:bg-white/15' };
    }
};

import useLeave from "../hooks/useLeave";
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import { useRoute } from "@react-navigation/native";

export default function LeaveScreen({ navigation }: any) {
    const { user } = useAuth();
    const route = useRoute<any>();
    const canApprove = user?.role === 'HR_ADMIN' || user?.role === 'MANAGER';
    const {
        loading,
        submitting,
        error,
        leaveBalances,
        leaveHistory,
        allLeaves,
        holidays,
        apply,
        approve,
        reject,
        refresh,
    } = useLeave();

    const [activeTab, setActiveTab] =
        useState<'MY_LEAVE' | 'APPROVALS'>(
            route.params?.activeTab ?? 'MY_LEAVE'
        );

    // Form Apply Leave
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveType, setLeaveType] = useState('CL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');

    // Rejection State
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectComment, setRejectComment] = useState('');

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        setActiveTab(route.params?.activeTab ?? 'MY_LEAVE');
    }, [route.params]);

    const handleApplyLeave = async () => {
        if (!fromDate || !toDate || !reason.trim()) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        // Weekend validation
        const partsStart = fromDate.split('-');
        const partsEnd = toDate.split('-');
        if (partsStart.length === 3 && partsEnd.length === 3) {
            const start = new Date(parseInt(partsStart[0]), parseInt(partsStart[1]) - 1, parseInt(partsStart[2]));
            const end = new Date(parseInt(partsEnd[0]), parseInt(partsEnd[1]) - 1, parseInt(partsEnd[2]));
            
            const current = new Date(start);
            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    Alert.alert('Error', 'Cannot apply for leave on weekends (Saturday/Sunday)');
                    return;
                }
                current.setDate(current.getDate() + 1);
            }
        }

        try {
            await apply({
                leaveTypeCode: leaveType,
                startDate: fromDate,
                endDate: toDate,
                reason,
            });

            Alert.alert("Success", "Leave application submitted!");
            setShowApplyModal(false);
            setLeaveType("CL");
            setFromDate("");
            setToDate("");
            setReason("");
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const handleApprove = async (leaveId: number) => {
        try {
            await approve(leaveId);
            Alert.alert("Success", "Leave approved successfully.");
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectingId || !rejectComment.trim()) {
            Alert.alert("Error", "Please enter rejection reason.");
            return;
        }

        try {
            await reject(rejectingId, rejectComment);
            Alert.alert("Success", "Leave rejected.");
            setRejectComment("");
            setRejectingId(null);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const getDateStatus = (dateStr: string) => {
        const holiday = holidays.find(h => {
            if (!h.date) return false;
            return h.date.split('T')[0] === dateStr;
        });
        if (holiday) return { type: 'Holiday', label: holiday.name };

        const leave = leaveHistory.find(l => {
            if (!l.startDate || !l.endDate) return false;
            const start = l.startDate.split('T')[0];
            const end = l.endDate.split('T')[0];
            return dateStr >= start && dateStr <= end;
        });
        if (leave) {
            return {
                type: 'Leave',
                label: leave.leaveType?.code || 'LV',
                status: leave.status
            };
        }

        return null;
    };

    // Calculate calendar days
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const dayCells: any[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        dayCells.push({ isEmpty: true, key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDate = new Date(year, month, d);
        dayCells.push({
            isEmpty: false,
            day: d,
            dateStr,
            dayDate,
            key: `day-${d}`,
        });
    }

    const generateCalendarCells = () => {
        return dayCells.map((cell) => {
            if (cell.isEmpty) {
                return (
                    <View
                        key={cell.key}
                        style={tw`w-[14.28%] h-14 p-1 border border-transparent`}
                    />
                );
            }

            const { day, dateStr, dayDate } = cell;
            const status = getDateStatus(dateStr);
            const isToday = new Date().toDateString() === dayDate.toDateString();
            const dayOfWeek = dayDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0));

            let cellBg = 'bg-white dark:bg-[#5b21b6]';
            let cellBorder = 'border-gray-100 dark:border-white/5';
            
            if (status?.type === 'Holiday') {
                cellBg = 'bg-purple-50 dark:bg-purple-950/20';
                cellBorder = 'border-purple-200 dark:border-purple-500/20';
            } else if (status?.type === 'Leave') {
                const leaveStatus = String(status.status).toUpperCase();
                if (leaveStatus === 'APPROVED') {
                    cellBg = 'bg-green-50 dark:bg-green-950/20';
                    cellBorder = 'border-green-200 dark:border-green-500/20';
                } else if (leaveStatus === 'REJECTED') {
                    cellBg = 'bg-rose-50 dark:bg-rose-950/20';
                    cellBorder = 'border-red-200 dark:border-red-500/20';
                } else {
                    cellBg = 'bg-orange-50 dark:bg-orange-950/20';
                    cellBorder = 'border-orange-200 dark:border-orange-500/20';
                }
            } else if (isWeekend) {
                cellBg = 'bg-gray-50/50 dark:bg-white/2';
            }

            return (
                <TouchableOpacity
                    key={dateStr}
                    onPress={() => {
                        if (isWeekend) {
                            Alert.alert('Info', 'Cannot apply for leave on weekends (Saturday/Sunday)');
                            return;
                        }
                        if (isPast && !status) {
                            Alert.alert('Info', 'Cannot apply for leave on past dates');
                            return;
                        }
                        if (!status) {
                            setFromDate(dateStr);
                            setToDate(dateStr);
                            setShowApplyModal(true);
                        }
                    }}
                    style={[
                        tw`w-[14.28%] h-14 p-1 border rounded-xl justify-between ${cellBg} ${cellBorder}`,
                        isToday && tw`border-2 border-[#8b5cf6] dark:border-[#8b5cf6]`
                    ]}
                >
                    {/* Day number */}
                    <View style={tw`flex-row justify-between w-full`}>
                        {isToday ? (
                            <View style={tw`w-5 h-5 rounded-full bg-[#8b5cf6] items-center justify-center -ml-0.5 -mt-0.5 shadow-sm`}>
                                <Text style={tw`text-[10px] font-bold text-white`}>{day}</Text>
                            </View>
                        ) : (
                            <Text style={tw`text-[10px] font-bold text-gray-700 dark:text-gray-300`}>{day}</Text>
                        )}
                    </View>

                    {/* Status Badge */}
                    {status && (
                        <View style={tw`w-full items-center mt-1`}>
                            {status.type === 'Holiday' ? (
                                <View style={tw`bg-purple-100 px-1.5 py-0.5 rounded-full w-full items-center`}>
                                    <Text numberOfLines={1} style={tw`text-[7px] font-extrabold text-purple-700 uppercase`}>
                                        {status.label}
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={[
                                        tw`px-1.5 py-0.5 rounded-full w-full items-center`,
                                        status.status === 'APPROVED' ? tw`bg-green-100` :
                                        status.status === 'REJECTED' ? tw`bg-rose-100` :
                                        tw`bg-orange-100`
                                    ]}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            tw`text-[7px] font-extrabold`,
                                            status.status === 'APPROVED' ? tw`text-green-700` :
                                            status.status === 'REJECTED' ? tw`text-rose-700` :
                                            tw`text-orange-700`
                                        ]}
                                    >
                                        {status.label}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            );
        });
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            <CustomHeader navigation={navigation} title={activeTab === 'APPROVALS' ? "Leave Approvals" : "My Leave"} />

            {loading ? (
                <View style={tw`flex-1 justify-center`}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <ScrollView style={tw`flex-1 p-4`} contentContainerStyle={tw`pb-12`}>
                    {activeTab === 'MY_LEAVE' ? (
                        <View>
                            {/* Page Header section matching web layout */}
                            <View style={tw`flex-row justify-between items-center mb-5`}>
                                <View style={tw`flex-1 mr-3`}>
                                    <Text style={tw`text-2xl font-bold text-gray-900 dark:text-white`}>
                                        My Leave
                                    </Text>
                                    <Text style={tw`text-[10px] text-gray-500 dark:text-gray-400 mt-0.5`}>
                                        View balances and plan your holidays.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setShowApplyModal(true)}
                                    style={tw`flex-row items-center gap-1.5 px-4 py-2.5 bg-[#8b5cf6] rounded-2xl shadow-sm shadow-[#8b5cf6]/20 active:scale-98`}
                                >
                                    <Plus size={14} color="#fff" />
                                    <Text style={tw`text-white font-bold text-xs`}>Apply Leave</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Leave Balances Grid */}
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>Available Balances</Text>
                            <View style={tw`flex-row flex-wrap justify-between mb-2`}>
                                {leaveBalances.map((balance, index) => {
                                    const style = getLeaveTypeStyle(balance.code || balance.leaveTypeCode || '');
                                    const isFullWidth = balance.code === 'EL' || balance.leaveTypeCode === 'EL';
                                    const total = balance.total || (balance.code === 'CL' ? 12 : balance.code === 'SL' ? 10 : 15);
                                    const percent = Math.min(100, Math.max(0, (balance.balance / total) * 100));

                                    return (
                                        <View 
                                            key={balance.code || balance.leaveTypeCode || index} 
                                            style={tw`${isFullWidth ? 'w-full' : 'w-[48%]'} bg-white dark:bg-[#4c1d95] p-5 rounded-3xl mb-4 border border-gray-150 dark:border-white/5 shadow-sm`}
                                        >
                                            <View style={tw`flex-row justify-between items-start`}>
                                                <View style={tw`flex-1 mr-2`}>
                                                    <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-white/70 uppercase tracking-wider`}>
                                                        {balance.name || balance.leaveType?.name || balance.code || balance.leaveTypeCode}
                                                    </Text>
                                                    <View style={tw`flex-row items-baseline gap-1 mt-2`}>
                                                        <Text style={tw`text-3xl font-black text-gray-800 dark:text-white`}>
                                                            {balance.balance}
                                                        </Text>
                                                        <Text style={tw`text-xs text-gray-400 dark:text-white/60 font-semibold`}>
                                                            / {total}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={tw`p-2.5 bg-[#f5f3ff] dark:bg-white rounded-2xl`}>
                                                    <Calendar size={18} color={style.color} />
                                                </View>
                                            </View>

                                            {/* Progress Bar */}
                                            <View style={tw`w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-4 overflow-hidden`}>
                                                <View style={[tw`h-full rounded-full ${style.fillClass}`, { width: `${percent}%` }]} />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Calendar Widget */}
                            <View style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl p-5 border border-gray-100 dark:border-white/5 shadow-sm mb-6 mt-2`}>
                                <View style={tw`flex-row justify-between items-center mb-4`}>
                                    <View style={tw`flex-row items-center gap-2`}>
                                        <Calendar size={18} color="#8b5cf6" />
                                        <Text style={tw`text-sm font-bold text-gray-900 dark:text-white`}>Leave Calendar</Text>
                                    </View>
                                    <View style={tw`flex-row items-center bg-gray-50 dark:bg-white/5 p-0.5 rounded-xl`}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const prev = new Date(currentMonth);
                                                prev.setMonth(prev.getMonth() - 1);
                                                setCurrentMonth(prev);
                                            }}
                                            style={tw`p-2`}
                                        >
                                            <ChevronLeft size={16} color="#8b5cf6" />
                                        </TouchableOpacity>
                                        <Text style={tw`text-xs font-bold text-gray-700 dark:text-white w-24 text-center`}>
                                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const next = new Date(currentMonth);
                                                next.setMonth(next.getMonth() + 1);
                                                setCurrentMonth(next);
                                            }}
                                            style={tw`p-2`}
                                        >
                                            <ChevronRight size={16} color="#8b5cf6" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Weekdays Headers */}
                                <View style={tw`flex-row w-full pb-2 mb-2 border-b border-gray-50 dark:border-white/5`}>
                                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                                        <View key={day} style={tw`flex-1 items-center`}>
                                            <Text style={tw`text-[10px] font-black text-gray-400 dark:text-gray-500`}>{day}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Calendar Days Cells */}
                                <View style={tw`flex-row flex-wrap w-full gap-y-1`}>
                                    {generateCalendarCells()}
                                </View>
                            </View>

                            {/* Leaves History */}
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>My Leave History</Text>
                            <View style={tw`bg-white dark:bg-[#4c1d95] rounded-3xl border border-gray-100 dark:border-white/5 p-5 shadow-sm`}>
                                {leaveHistory.length === 0 ? (
                                    <Text style={tw`text-center py-6 text-gray-400`}>No leave requests recorded.</Text>
                                ) : (
                                    leaveHistory.map((leave) => {
                                        const leaveStatus = String(leave.status).toUpperCase();
                                        const isApproved = leaveStatus === 'APPROVED';
                                        const isRejected = leaveStatus === 'REJECTED';
                                        
                                        const dotColor = isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-orange-500';
                                        const badgeBg = isApproved ? 'bg-green-100' :
                                                        isRejected ? 'bg-red-100' :
                                                        'bg-orange-100';
                                        const badgeTextColor = isApproved ? 'text-green-700' :
                                                               isRejected ? 'text-red-700' :
                                                               'text-orange-700';
                                        
                                        return (
                                            <View key={leave.id} style={tw`py-3.5 border-b border-gray-50 dark:border-white/5 last:border-0 flex-row items-start gap-3`}>
                                                <View style={tw`w-2 h-2 rounded-full mt-1.5 ${dotColor}`} />
                                                <View style={tw`flex-1 mr-2`}>
                                                    <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>
                                                        {leave.leaveType?.code || 'CL'} - {leave.reason || 'Personal leave'}
                                                    </Text>
                                                    <Text style={tw`text-[10px] text-gray-400 dark:text-gray-500 mt-1`}>
                                                        {formatHistoryDate(leave.startDate)} - {formatHistoryDate(leave.endDate)}
                                                    </Text>
                                                </View>
                                                <View style={tw`px-2.5 py-0.5 rounded-full ${badgeBg} justify-center`}>
                                                    <Text style={tw`text-[9px] font-black uppercase ${badgeTextColor}`}>
                                                        {leaveStatus}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </View>

                            {/* Upcoming Holiday Dynamic Section */}
                            {(() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const nextHoliday = [...holidays]
                                    .filter(h => h.date && new Date(h.date) >= today)
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                                if (!nextHoliday) return null;

                                const hDate = new Date(nextHoliday.date);
                                return (
                                    <View style={tw`bg-purple-50 dark:bg-purple-950/20 rounded-3xl p-5 border border-purple-150 dark:border-purple-500/20 mt-6 shadow-sm`}>
                                        <Text style={tw`font-bold text-purple-800 dark:text-purple-300 mb-3 text-xs`}>
                                            Upcoming Holiday
                                        </Text>
                                        <View style={tw`flex-row items-center gap-4`}>
                                            <View style={tw`bg-white dark:bg-purple-900/40 p-2.5 rounded-2xl text-center min-w-[65px] shadow-sm items-center`}>
                                                <Text style={tw`text-[9px] font-black text-purple-400 dark:text-purple-300 uppercase tracking-wider`}>
                                                    {hDate.toLocaleDateString('en-US', { month: 'short' })}
                                                </Text>
                                                <Text style={tw`text-xl font-black text-purple-600 dark:text-purple-200 mt-0.5`}>
                                                    {hDate.getDate()}
                                                </Text>
                                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`font-bold text-gray-800 dark:text-white text-sm`}>
                                                    {nextHoliday.name}
                                                </Text>
                                                <Text style={tw`text-[10px] font-bold text-purple-500 dark:text-purple-400 mt-1 uppercase tracking-wider`}>
                                                    {hDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })()}
                        </View>
                    ) : (
                        /* Approvals view for HR Admin / Manager */
                        <View>
                            <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>Pending Leave Approvals</Text>
                            {allLeaves.filter(l => l.status === 'PENDING').length === 0 ? (
                                <Text style={tw`text-center py-10 text-gray-400`}>No pending leave approvals.</Text>
                            ) : (
                                allLeaves
                                    .filter((leave) => leave.status === "PENDING")
                                    .map((leave) => {
                                        const name = leave.user?.name || `Employee #${leave.userId}`;
                                        return (
                                            <View
                                                key={leave.id}
                                                style={tw`bg-white dark:bg-[#4c1d95] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}
                                            >
                                                <Text style={tw`font-bold text-sm text-gray-900 dark:text-white`}>{name}</Text>
                                                <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                    Type: {leave.leaveType?.code} • Date: {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                                                </Text>
                                                <Text style={tw`text-xs text-gray-500 italic my-3`}>
                                                    "{leave.reason}"
                                                </Text>

                                                <View style={tw`flex-row gap-3`}>
                                                    <TouchableOpacity
                                                        onPress={() => handleApprove(leave.id)}
                                                        style={tw`flex-1 py-2 bg-green-50 dark:bg-green-950/20 border border-transparent dark:border-green-800/30 rounded-xl items-center flex-row justify-center gap-1`}
                                                    >
                                                        <Check size={16} color="#10b981" />
                                                        <Text style={tw`text-xs font-bold text-green-600 dark:text-green-400`}>Approve</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setRejectingId(leave.id);
                                                            setRejectComment('');
                                                        }}
                                                        style={tw`flex-1 py-2 bg-rose-50 dark:bg-rose-950/20 border border-transparent dark:border-rose-800/30 rounded-xl items-center flex-row justify-center gap-1`}
                                                    >
                                                        <X size={16} color="#f43f5e" />
                                                        <Text style={tw`text-xs font-bold text-rose-500 dark:text-rose-400`}>Reject</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })
                            )}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Apply Leave Modal */}
            <Modal
                visible={showApplyModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowApplyModal(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={tw`flex-1 justify-center items-center bg-black/60 p-4`}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={tw`w-full max-w-sm`}
                        >
                            <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl w-full`}>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={tw`pb-2`}>
                                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-4`}>Apply for Leave</Text>

                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Leave Type (CL, SL, EL)</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
                                            value={leaveType}
                                            onChangeText={setLeaveType}
                                            autoCapitalize="characters"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Start Date (YYYY-MM-DD)</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
                                            placeholder="e.g. 2026-07-15"
                                            placeholderTextColor="#9ca3af"
                                            value={fromDate}
                                            onChangeText={setFromDate}
                                        />
                                    </View>

                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>End Date (YYYY-MM-DD)</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
                                            placeholder="e.g. 2026-07-16"
                                            placeholderTextColor="#9ca3af"
                                            value={toDate}
                                            onChangeText={setToDate}
                                        />
                                    </View>

                                    <View style={tw`mb-6`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Reason for leave *</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
                                            placeholder="Personal emergency..."
                                            placeholderTextColor="#9ca3af"
                                            value={reason}
                                            onChangeText={setReason}
                                        />
                                    </View>

                                    <View style={tw`flex-row gap-4 mb-2`}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowApplyModal(false);
                                                setLeaveType("CL");
                                                setFromDate("");
                                                setToDate("");
                                                setReason("");
                                            }}
                                            style={tw`flex-1 py-3 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleApplyLeave}
                                            disabled={submitting}
                                            style={tw`flex-1 py-3 bg-[#8b5cf6] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-white font-bold`}>
                                                {submitting ? 'Applying...' : 'Apply'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Rejection comment modal for Admin */}
            <Modal
                visible={!!rejectingId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setRejectingId(null)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={tw`flex-1 justify-center items-center bg-black/60 p-4`}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={tw`w-full max-w-sm`}
                        >
                            <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl w-full`}>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={tw`pb-2`}>
                                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-2`}>Reject Leave Application</Text>
                                    <Text style={tw`text-xs text-gray-500 mb-4`}>Please provide a reason for rejecting this leave request.</Text>

                                    <TextInput
                                        style={tw`w-full px-4 py-3 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white min-h-20 mb-6`}
                                        placeholder="Reason for rejection..."
                                        placeholderTextColor="#cbd5e1"
                                        multiline={true}
                                        value={rejectComment}
                                        onChangeText={setRejectComment}
                                    />

                                    <View style={tw`flex-row gap-4 mb-2`}>
                                        <TouchableOpacity
                                            onPress={() => setRejectingId(null)}
                                            style={tw`flex-1 py-3 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleRejectSubmit}
                                            disabled={submitting}
                                            style={tw`flex-1 py-3 bg-rose-500 rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-white font-bold`}>
                                                {submitting ? 'Rejecting...' : 'Reject'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
