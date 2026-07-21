import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { Clock, Calendar, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, MapPin, Coffee, X } from 'lucide-react-native';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import tw from 'twrnc';
import { useToast } from '../context/ToastContext';

export default function AttendanceScreen({ route, navigation }: any) {
    const targetUserId = route.params?.id; // If passed, view specific user attendance (Admin view)
    const isSelf = !targetUserId;
    const { showToast } = useToast();

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

    // Web alignment data states
    const [holidays, setHolidays] = useState<any[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    const [regularizationRequests, setRegularizationRequests] = useState<any[]>([]);
    const [joiningDate, setJoiningDate] = useState<Date | null>(null);
    const [attendancePolicy, setAttendancePolicy] = useState<any>({ regularizationDays: 3 });

    // Regularization State
    const [regularizeDate, setRegularizeDate] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [inInputText, setInInputText] = useState('09:00 AM');
    const [outInputText, setOutInputText] = useState('06:00 PM');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Rejected Details Modals
    const [rejectedRequestToShow, setRejectedRequestToShow] = useState<any>(null);
    const [rejectedLeaveToShow, setRejectedLeaveToShow] = useState<any>(null);


    const pinchScale = useRef(new Animated.Value(1)).current;
    const baseScale = useRef(new Animated.Value(1)).current;
    const scale = Animated.multiply(baseScale, pinchScale);
    const [focalOrigin, setFocalOrigin] = useState<string>('50% 50%');
    const [isZoomed, setIsZoomed] = useState(false);

    const onPinchEvent = useRef(
        Animated.event(
            [{ nativeEvent: { scale: pinchScale } }],
            {
                useNativeDriver: Platform.OS !== 'web',
                listener: (event: any) => {
                    const fx = event.nativeEvent?.focalX;
                    const fy = event.nativeEvent?.focalY;
                    if (fx !== undefined && fy !== undefined) {
                        setFocalOrigin(`${Math.round(fx)}px ${Math.round(fy)}px`);
                    }
                }
            }
        )
    ).current;

    const onPinchStateChange = (event: any) => {
        const fx = event.nativeEvent?.focalX;
        const fy = event.nativeEvent?.focalY;
        if (fx !== undefined && fy !== undefined) {
            setFocalOrigin(`${Math.round(fx)}px ${Math.round(fy)}px`);
        }

        if (event.nativeEvent.oldState === State.ACTIVE) {
            let lastScale = event.nativeEvent.scale || 1;
            let currentVal = (baseScale as any)._value || 1;
            let newScale = Math.min(3, Math.max(1, currentVal * lastScale));

            baseScale.setValue(newScale);
            pinchScale.setValue(1);
            setIsZoomed(newScale > 1.05);
        }
    };

    const resetZoom = () => {
        Animated.parallel([
            Animated.spring(baseScale, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(pinchScale, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
        setFocalOrigin('50% 50%');
        setIsZoomed(false);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStatusAndPolicy = async () => {
        try {
            if (isSelf) {
                const res = await api.get('/attendance/status');
                setIsPunchedIn(res.data.isPunchedIn);
                if (res.data.punchInTime) setPunchInTime(new Date(res.data.punchInTime));
            }

            const empUrl = isSelf ? '/employee/me' : `/employee/${targetUserId}`;
            const empRes = await api.get(empUrl);
            const jd = empRes.data.employeeProfile?.joiningDate || empRes.data.createdAt;
            if (jd) {
                const datePart = jd.split('T')[0];
                const [year, month, day] = datePart.split('-').map(Number);
                setJoiningDate(new Date(year, month - 1, day));
            }

            // Fetch holidays
            const holidayRes = await api.get('/masters/holidays');
            setHolidays(holidayRes.data || []);

            // Fetch policy for regularization lookback days limit (defaults to 3)
            try {
                const policyRes = await api.get('/masters/attendance-policy');
                if (policyRes.data) {
                    setAttendancePolicy(policyRes.data);
                }
            } catch (e) {
                setAttendancePolicy({ regularizationDays: 3 });
            }
        } catch (error) {
            console.error("Failed to fetch initial status & policy:", error);
        }
    };

    const fetchHistoryAndRequests = async () => {
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

            // Fetch regularization requests to show status on calendar
            try {
                const reqRes = await api.get('/attendance/regularize/my-requests');
                setRegularizationRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
            } catch (e) {
                console.error("Failed to fetch regularization requests:", e);
            }

            // Fetch leave history to show leaves on the calendar
            try {
                const leaveRes = await api.get('/leave/history');
                setLeaveHistory(Array.isArray(leaveRes.data) ? leaveRes.data : []);
            } catch (leaveErr) {
                console.error("Failed to fetch leave history in Attendance:", leaveErr);
            }
        } catch (error) {
            console.error("Failed to fetch history or stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatusAndPolicy();
    }, [isSelf, targetUserId]);

    useEffect(() => {
        fetchHistoryAndRequests();
    }, [selectedMonth, targetUserId, joiningDate]);

    const handlePunch = async () => {
        try {
            const res = await api.post('/attendance/punch');
            showToast(res.data.message || 'Action completed successfully', 'success');
            fetchStatusAndPolicy();
            fetchHistoryAndRequests();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error occurred during punch', 'error');
        }
    };

    const submitRegularization = async () => {
        if (!reason.trim()) {
            showToast("Please provide a reason for regularization.", 'error');
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
            showToast("Regularization request submitted!", 'success');
            setRegularizeDate(null);
            setReason('');
            setInInputText('09:00 AM');
            setOutInputText('06:00 PM');
            fetchHistoryAndRequests();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to submit request.", 'error');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const formatTime = (time: any) => {
        if (!time) return '--:--';
        if (typeof time === 'string' && (time.includes('AM') || time.includes('PM'))) {
            return time;
        }
        const d = new Date(time);
        if (isNaN(d.getTime())) {
            return time;
        }
        return d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const changeMonth = (direction: 'next' | 'prev') => {
        const nextMonth = new Date(selectedMonth);
        nextMonth.setMonth(selectedMonth.getMonth() + (direction === 'next' ? 1 : -1));
        setSelectedMonth(nextMonth);
    };

    const renderStatusBadge = (statusLabel: string) => {
        if (statusLabel === '-' || statusLabel === 'Weekend') {
            if (statusLabel !== 'Weekend') return null;
        }

        let badgeBg = 'bg-gray-100 dark:bg-gray-800';
        let badgeText = 'text-gray-700 dark:text-gray-300';
        let borderStyle = '';
        let displayLabel = statusLabel;

        if (statusLabel.startsWith('Leave (Pending)')) {
            badgeBg = 'bg-amber-100 dark:bg-amber-500/20';
            badgeText = 'text-amber-700 dark:text-amber-300';
            borderStyle = 'border border-dashed border-amber-300 dark:border-amber-500/30';
            displayLabel = 'Leave\nPending';
        } else if (statusLabel.startsWith('Leave (Rejected)')) {
            badgeBg = 'bg-rose-100 dark:bg-rose-500/20';
            badgeText = 'text-rose-700 dark:text-rose-300';
            borderStyle = 'border border-dashed border-rose-300 dark:border-rose-500/30';
            displayLabel = 'Leave\nRejected';
        } else if (statusLabel.startsWith('Leave (Approved)')) {
            badgeBg = 'bg-blue-100 dark:bg-blue-500/20';
            badgeText = 'text-blue-700 dark:text-blue-300';
            displayLabel = 'Leave\nApproved';
        } else if (statusLabel.startsWith('Regularization (Pending)')) {
            badgeBg = 'bg-amber-100 dark:bg-amber-500/20';
            badgeText = 'text-amber-700 dark:text-amber-300';
            borderStyle = 'border border-dashed border-amber-300 dark:border-amber-500/30';
            displayLabel = 'Regularization\nPending';
        } else if (statusLabel.startsWith('Regularization (Rejected)')) {
            badgeBg = 'bg-rose-100 dark:bg-rose-500/20';
            badgeText = 'text-rose-700 dark:text-rose-300';
            borderStyle = 'border border-dashed border-rose-300 dark:border-rose-500/30';
            displayLabel = 'Regularization\nRejected';
        } else if (statusLabel === 'Present') {
            badgeBg = 'bg-green-100 dark:bg-green-500/20';
            badgeText = 'text-green-700 dark:text-green-300';
            displayLabel = 'Present';
        } else if (statusLabel === 'Absent') {
            badgeBg = 'bg-red-100 dark:bg-red-500/20';
            badgeText = 'text-red-700 dark:text-red-300';
            displayLabel = 'Absent';
        } else if (statusLabel === 'Late') {
            badgeBg = 'bg-orange-100 dark:bg-orange-500/20';
            badgeText = 'text-orange-700 dark:text-orange-300';
            displayLabel = 'Late';
        } else if (statusLabel === 'Holiday') {
            badgeBg = 'bg-purple-100 dark:bg-purple-500/20';
            badgeText = 'text-purple-700 dark:text-purple-300';
            displayLabel = 'Holiday';
        } else if (statusLabel === 'Weekend') {
            badgeBg = 'bg-gray-100 dark:bg-gray-800';
            badgeText = 'text-gray-500 dark:text-gray-400';
            displayLabel = 'Weekend';
        }

        const lines = displayLabel.split('\n');

        return (
            <View style={tw`px-1 py-0.2 rounded ${badgeBg} ${borderStyle} items-center justify-center`}>
                {lines.map((line, idx) => (
                    <Text key={idx} style={[tw`text-[5px] font-black tracking-wide ${badgeText} text-center`, { lineHeight: 6 }]}>
                        {line}
                    </Text>
                ))}
            </View>
        );
    };

    const getFirstMissedPunch = () => {
        if (loading) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lookbackDays = attendancePolicy?.regularizationDays ?? 3;

        for (let i = 1; i <= lookbackDays; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            checkDate.setHours(0, 0, 0, 0);

            const year = checkDate.getFullYear();
            const month = checkDate.getMonth() + 1;
            const day = checkDate.getDate();
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
            if (isWeekend) continue;

            if (joiningDate && checkDate < joiningDate) continue;

            const isHoliday = holidays.some(h => h.date.split('T')[0] === dateStr);
            if (isHoliday) continue;

            const log = attendanceHistory.find(d => d.date === dateStr);
            const isAbsent = !log || log.status === 'Absent';
            if (!isAbsent) continue;

            const request = regularizationRequests.find(r => r.date === dateStr);
            if (request) continue;

            return dateStr;
        }

        return null;
    };

    const getCalendarDays = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({
                isEmpty: true,
                key: `empty-${i}`
            });
        }

        const todayMidnight = new Date();
        todayMidnight.setHours(23, 59, 59, 999);

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const log = attendanceHistory.find(d => d.date === dateStr);
            const holiday = holidays.find(h => h.date.split('T')[0] === dateStr);

            const currentLoopDate = new Date(year, month, day);
            const isWeekend = currentLoopDate.getDay() === 0 || currentLoopDate.getDay() === 6;
            const isBeforeJoining = joiningDate && currentLoopDate < joiningDate;

            // Precise future date checking
            const isFuture = currentLoopDate > todayMidnight;

            // Find matching leave (APPROVED or PENDING or REJECTED)
            const leave = leaveHistory.find(l => {
                const start = l.startDate.split('T')[0];
                const end = l.endDate.split('T')[0];
                return dateStr >= start && dateStr <= end;
            });

            // Default logic if no log exists
            let displayStatus = log ? log.status : holiday ? 'Holiday' : isWeekend ? 'Weekend' : isBeforeJoining ? 'Weekend' : isFuture ? 'Weekend' : 'Absent';

            // Check for regularization status
            const request = regularizationRequests.find(r => r.date === dateStr);
            const hasPendingRequest = request && request.status === 'PENDING';
            const hasRejectedRequest = request && request.status === 'REJECTED';

            if (hasPendingRequest) {
                displayStatus = 'Pending';
            }

            let statusLabel = isBeforeJoining ? '-' : holiday ? 'Holiday' : (isFuture && !isWeekend) ? '-' : displayStatus;

            if (!isBeforeJoining && !holiday) {
                if (hasPendingRequest) {
                    statusLabel = 'Regularization (Pending)';
                } else if (hasRejectedRequest) {
                    statusLabel = 'Regularization (Rejected)';
                } else if ((displayStatus === 'Absent' || isFuture) && leave) {
                    if (leave.status === 'APPROVED') {
                        statusLabel = 'Leave (Approved)';
                    } else if (leave.status === 'PENDING') {
                        statusLabel = 'Leave (Pending)';
                    } else if (leave.status === 'REJECTED') {
                        statusLabel = 'Leave (Rejected)';
                    }
                }
            }

            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            days.push({
                isEmpty: false,
                day,
                dateStr,
                log,
                holiday,
                isWeekend,
                isBeforeJoining,
                isFuture,
                isToday,
                leave,
                displayStatus,
                statusLabel,
                hasPendingRequest,
                hasRejectedRequest
            });
        }

        return days;
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const isHolidayToday = holidays.some(h => h.date.split('T')[0] === todayStr);
    const isOnLeaveToday = leaveHistory.some(l => {
        if (l.status !== 'APPROVED') return false;
        const start = l.startDate.split('T')[0];
        const end = l.endDate.split('T')[0];
        return todayStr >= start && todayStr <= end;
    });

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>

            <CustomHeader navigation={navigation} title="My Attendance" />

            <ScrollView style={tw`flex-1 px-4 pt-4`} contentContainerStyle={tw`pb-12`}>

                {/* Real-time Punch Card */}
                {isSelf && (
                    <View style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl mb-5 items-center w-full relative overflow-hidden`}>
                        {/* Top gradient accent line */}
                        <View style={[tw`absolute top-0 left-0 right-0 h-1.5`, { backgroundColor: '#8b5cf6' }]} />

                        <Text style={tw`text-[11px] text-gray-500 dark:text-gray-300 font-bold uppercase tracking-wider mb-1`}>
                            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                        <Text style={tw`text-3xl font-black text-gray-800 dark:text-white font-mono tracking-widest`}>
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </Text>

                        {/* Circular Glowing button ("Cylinder") */}
                        <View style={tw`relative items-center justify-center my-4`}>
                            <View
                                style={[
                                    tw`absolute w-36 h-36 rounded-full opacity-20 blur-lg`,
                                    {
                                        backgroundColor: isHolidayToday ? '#8b5cf6' : isOnLeaveToday ? '#ef4444' : isPunchedIn ? '#ef4444' : '#22c55e',
                                    }
                                ]}
                            />

                            <TouchableOpacity
                                onPress={handlePunch}
                                disabled={isHolidayToday || isOnLeaveToday}
                                style={[
                                    tw`w-32 h-32 rounded-full border-4 items-center justify-center shadow-xl`,
                                    isHolidayToday ? tw`bg-[#faf5ff] dark:bg-[#8b5cf6]/10` :
                                        isOnLeaveToday ? tw`bg-[#fff1f2] dark:bg-[#ef4444]/10` :
                                            isPunchedIn ? tw`bg-[#fef2f2] dark:bg-[#ef4444]/10` :
                                                tw`bg-[#f0fdf4] dark:bg-[#22c55e]/10`,
                                    {
                                        borderColor: isHolidayToday
                                            ? '#8b5cf6'
                                            : isOnLeaveToday
                                                ? '#ef4444'
                                                : isPunchedIn
                                                    ? '#ef4444'
                                                    : '#22c55e'
                                    }
                                ]}
                            >
                                <View style={tw`mb-1`}>
                                    {isHolidayToday ? (
                                        <Calendar size={28} color="#8b5cf6" />
                                    ) : isOnLeaveToday ? (
                                        <Calendar size={28} color="#ef4444" />
                                    ) : isPunchedIn ? (
                                        <Coffee size={28} color="#ef4444" />
                                    ) : (
                                        <MapPin size={28} color="#22c55e" />
                                    )}
                                </View>

                                <Text style={[
                                    tw`text-sm font-black uppercase tracking-wider`,
                                    isHolidayToday ? tw`text-[#8b5cf6] dark:text-[#a78bfa]` :
                                        isOnLeaveToday ? tw`text-[#ef4444] dark:text-[#fca5a5]` :
                                            isPunchedIn ? tw`text-[#ef4444] dark:text-[#fca5a5]` :
                                                tw`text-[#22c55e] dark:text-[#86efac]`
                                ]}>
                                    {isHolidayToday ? 'Holiday' : isOnLeaveToday ? 'On Leave' : isPunchedIn ? 'Punch Out' : 'Punch In'}
                                </Text>

                                <Text style={[
                                    tw`text-[8.5px] mt-0.5 font-bold text-center px-4`,
                                    isHolidayToday ? tw`text-[#8b5cf6]/75 dark:text-[#a78bfa]/75` :
                                        isOnLeaveToday ? tw`text-[#ef4444]/75 dark:text-[#fca5a5]/75` :
                                            isPunchedIn ? tw`text-[#ef4444]/75 dark:text-[#fca5a5]/75` :
                                                tw`text-[#22c55e]/75 dark:text-[#86efac]/75`
                                ]}>
                                    {isHolidayToday ? 'Relax & Enjoy!' : isOnLeaveToday ? 'Enjoy your leave!' : isPunchedIn ? 'Enjoy your evening!' : 'Delhi Office (GPS)'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isPunchedIn && punchInTime && (
                            <View style={tw`mt-1 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-2xl flex-row items-center gap-2 border border-gray-100 dark:border-white/5`}>
                                <Clock size={12} color="#8b5cf6" />
                                <Text style={tw`text-[11px] text-purple-700 dark:text-purple-300 font-medium`}>
                                    In Time: <Text style={tw`font-bold text-gray-800 dark:text-white`}>{punchInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Stats View */}
                <View style={tw`flex-row flex-wrap justify-between gap-y-3 mb-6`}>
                    {[
                        { label: 'Present Days', val: stats.present, icon: <CheckCircle size={20} color="#16a34a" />, bgIcon: 'bg-green-100 dark:bg-green-500/20' },
                        { label: 'Absents', val: stats.absent, icon: <AlertCircle size={20} color="#dc2626" />, bgIcon: 'bg-red-100 dark:bg-red-500/20' },
                        { label: 'Late Marks', val: stats.late, icon: <Clock size={20} color="#d97706" />, bgIcon: 'bg-amber-100 dark:bg-amber-500/20' },
                        { label: 'Holidays', val: stats.holiday, icon: <Coffee size={20} color="#2563eb" />, bgIcon: 'bg-blue-100 dark:bg-blue-500/20' },
                    ].map((s, idx) => (
                        <View key={idx} style={tw`w-[48%] bg-white dark:bg-[#4c1d95] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                            <View style={tw`w-10 h-10 ${s.bgIcon} rounded-xl items-center justify-center mb-3`}>
                                {s.icon}
                            </View>
                            <Text style={tw`text-2xl font-black text-gray-900 dark:text-white`}>{s.val}</Text>
                            <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-purple-200 uppercase tracking-wide mt-1`}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Missed Punch Alert (Dynamic) */}
                {(() => {
                    const missedPunchDate = getFirstMissedPunch();
                    if (!missedPunchDate) return null;

                    const [y, m, d] = missedPunchDate.split('-').map(Number);
                    const formattedMissedDate = new Date(y, m - 1, d).toLocaleDateString([], { day: 'numeric', month: 'short' });

                    return (
                        <View style={tw`bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-4 flex-row items-center justify-between mb-6 shadow-sm`}>
                            <View style={tw`flex-1 flex-row items-center gap-3 pr-2`}>
                                <AlertCircle size={20} color="#ea580c" />
                                <View style={tw`flex-1`}>
                                    <Text style={tw`font-bold text-orange-800 dark:text-orange-200 text-xs`}>Action Needed: Missed Punch</Text>
                                    <Text style={tw`text-[10px] text-orange-600 dark:text-orange-300 mt-0.5`}>
                                        You have a missed check-in on <Text style={tw`font-black`}>{formattedMissedDate}</Text>. Correct this now.
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setRegularizeDate(missedPunchDate)}
                                style={tw`px-3 py-1.5 bg-orange-600 dark:bg-orange-500/30 rounded-lg shadow-sm`}
                            >
                                <Text style={tw`text-white dark:text-orange-200 text-[10px] font-bold`}>Fix Now</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })()}

                {/* Month Controller */}
                <View style={tw`flex-row justify-between items-center bg-white dark:bg-[#4c1d95] p-3 rounded-2xl mb-4 border border-gray-100 dark:border-white/5`}>
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

                {/* Monthly Log Grid Calendar */}
                <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
                    <Animated.View style={[tw`bg-white dark:bg-[#4c1d95] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm p-4`, { transformOrigin: focalOrigin as any, transform: [{ scale }] }]}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`font-bold text-gray-900 dark:text-white text-sm`}>Monthly Log</Text>
                            {isZoomed && (
                                <TouchableOpacity
                                    onPress={resetZoom}
                                    style={tw`px-2.5 py-1 bg-[#8b5cf6]/10 dark:bg-white/10 rounded-xl border border-[#8b5cf6]/20 active:scale-95`}
                                >
                                    <Text style={tw`text-[10px] font-bold text-[#8b5cf6] dark:text-[#c4b5fd]`}>
                                        Reset Zoom
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {loading ? (
                            <ActivityIndicator size="small" color="#8b5cf6" style={tw`py-10`} />
                        ) : (
                            <View style={tw`w-full`}>
                                {/* Calendar Headers */}
                                <View style={tw`flex-row w-full border-b border-gray-100 dark:border-white/5 pb-2 mb-2`}>
                                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                                        <View key={day} style={tw`flex-1 items-center`}>
                                            <Text style={tw`text-[9px] font-bold text-gray-400 dark:text-gray-500`}>{day}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Calendar Cells Grid */}
                                <View style={tw`flex-row flex-wrap w-full`}>
                                    {getCalendarDays().map((dayObj, index) => {
                                        if (dayObj.isEmpty) {
                                            return (
                                                <View
                                                    key={dayObj.key}
                                                    style={tw`w-[14.28%] h-24 bg-gray-50/20 dark:bg-white/2 border border-gray-50 dark:border-white/2 rounded-lg`}
                                                />
                                            );
                                        }

                                        const {
                                            day,
                                            dateStr,
                                            log,
                                            holiday,
                                            isWeekend,
                                            isBeforeJoining,
                                            isFuture,
                                            isToday,
                                            leave,
                                            statusLabel,
                                            hasPendingRequest,
                                            hasRejectedRequest
                                        } = dayObj;

                                        // Resolve Background Colors & Borders based on status
                                        let cellBg = 'bg-white dark:bg-[#4c1d95]';
                                        let borderStyle = 'border-gray-100 dark:border-white/5';
                                        let statusColor = 'text-gray-400 dark:text-gray-500';

                                        if (holiday) {
                                            cellBg = 'bg-purple-50 dark:bg-purple-950/20';
                                            borderStyle = 'border-purple-200 dark:border-purple-500/20';
                                            statusColor = 'text-purple-600 dark:text-purple-400';
                                        } else if (hasPendingRequest || (leave && leave.status === 'PENDING')) {
                                            cellBg = 'bg-amber-50 dark:bg-amber-950/10';
                                            borderStyle = 'border-dashed border-amber-300 dark:border-amber-500/20';
                                            statusColor = 'text-amber-600 dark:text-amber-400';
                                        } else if (hasRejectedRequest || (leave && leave.status === 'REJECTED')) {
                                            cellBg = 'bg-rose-50 dark:bg-rose-950/10';
                                            borderStyle = 'border-dashed border-rose-300 dark:border-rose-500/20';
                                            statusColor = 'text-rose-600 dark:text-rose-400';
                                        } else if (leave && leave.status === 'APPROVED') {
                                            cellBg = 'bg-blue-50 dark:bg-blue-950/20';
                                            borderStyle = 'border-blue-200 dark:border-blue-500/20';
                                            statusColor = 'text-blue-600 dark:text-blue-400';
                                        } else if (log) {
                                            if (log.status === 'Present') {
                                                statusColor = 'text-green-600 dark:text-green-400';
                                            } else if (log.status === 'Late') {
                                                statusColor = 'text-orange-600 dark:text-orange-400';
                                            } else if (log.status === 'Absent') {
                                                statusColor = 'text-red-600 dark:text-red-400';
                                            }
                                        } else if (isWeekend || isBeforeJoining || isFuture) {
                                            cellBg = 'bg-gray-50/50 dark:bg-gray-900/10';
                                            statusColor = 'text-gray-400 dark:text-gray-500';
                                        } else {
                                            // Absent by default
                                            cellBg = 'bg-red-50/50 dark:bg-red-950/10';
                                            statusColor = 'text-red-600 dark:text-red-400';
                                        }

                                        const canRegularize = !isToday && !isFuture && !isBeforeJoining && !hasPendingRequest && !hasRejectedRequest && !leave && (statusLabel === 'Absent' || statusLabel === 'Late');
                                        const request = regularizationRequests.find(r => r.date === dateStr);
                                        const isClickable = isSelf && (canRegularize || hasRejectedRequest || (leave && leave.status === 'REJECTED'));

                                        return (
                                            <TouchableOpacity
                                                key={dateStr}
                                                onPress={() => {
                                                    if (hasRejectedRequest) {
                                                        setRejectedRequestToShow(request);
                                                    } else if (leave && leave.status === 'REJECTED') {
                                                        setRejectedLeaveToShow(leave);
                                                    } else if (canRegularize && isSelf) {
                                                        setRegularizeDate(dateStr || null);
                                                        setInInputText(log?.inTime ? formatTime(log.inTime) : '09:00 AM');
                                                        setOutInputText(log?.outTime ? formatTime(log.outTime) : '06:00 PM');
                                                        setReason('');
                                                    }
                                                }}
                                                disabled={!isClickable}
                                                style={[
                                                    tw`w-[14.28%] h-24 p-1 border rounded-lg justify-between ${cellBg} ${borderStyle}`,
                                                    isToday && tw`border-2 border-purple-500`
                                                ]}
                                            >
                                                {/* Day number in the header row */}
                                                <View style={tw`flex-row w-full`}>
                                                    <Text style={[tw`text-[9px] font-bold`, isToday ? tw`text-purple-600` : tw`text-gray-800 dark:text-white`]}>
                                                        {day}
                                                    </Text>
                                                </View>

                                                {/* Center Status Badge */}
                                                {statusLabel !== '-' && (
                                                    <View style={tw`w-full items-center mt-0.5`}>
                                                        {renderStatusBadge(statusLabel)}
                                                    </View>
                                                )}

                                                {/* Middle Details (Holiday Name or Leave Type Name) */}
                                                <View style={tw`w-full items-center`}>
                                                    {holiday && (
                                                        <View style={tw`bg-purple-100 dark:bg-purple-900/30 px-0.5 py-0.2 rounded w-full items-center mt-0.5`}>
                                                            <Text numberOfLines={1} style={[tw`text-[5px] font-bold text-purple-700 dark:text-purple-300`, { lineHeight: 6.5 }]}>
                                                                {holiday.name}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {!holiday && leave && !isBeforeJoining && (statusLabel === 'Absent' || isFuture) && (
                                                        <View
                                                            style={[
                                                                tw`px-0.5 py-0.2 rounded w-full items-center mt-0.5`,
                                                                leave.status === 'APPROVED' ? tw`bg-blue-100 dark:bg-blue-900/30` :
                                                                    leave.status === 'PENDING' ? tw`bg-amber-100 dark:bg-amber-900/30` :
                                                                        tw`bg-rose-100 dark:bg-rose-900/30`
                                                            ]}
                                                        >
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[
                                                                    tw`text-[5px] font-bold`,
                                                                    leave.status === 'APPROVED' ? tw`text-blue-700 dark:text-blue-300` :
                                                                        leave.status === 'PENDING' ? tw`text-amber-700 dark:text-amber-300` :
                                                                            tw`text-rose-700 dark:text-rose-300`,
                                                                    { lineHeight: 6.5 }
                                                                ]}
                                                            >
                                                                {leave.leaveType?.name || 'Leave'}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* In/Out timings if log exists */}
                                                {log && (log.inTime || log.outTime) ? (
                                                    <View style={tw`w-full border-t border-gray-100 dark:border-white/5 pt-0.5 mt-0.5 items-center`}>
                                                        <Text style={[tw`text-[5.5px] font-semibold text-green-600 dark:text-green-400`, { lineHeight: 7 }]}>
                                                            {log.inTime ? formatTime(log.inTime) : '--'}
                                                        </Text>
                                                        <Text style={[tw`text-[5.5px] font-semibold text-red-500 dark:text-red-400 mt-0.5`, { lineHeight: 7 }]}>
                                                            {log.outTime ? formatTime(log.outTime) : '--'}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </PinchGestureHandler>

            </ScrollView>

            {/* Regularization Modal */}
            <Modal
                visible={!!regularizeDate}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRegularizeDate(null)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={tw`flex-1 justify-end bg-black/60`}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={tw`w-full`}
                        >
                            <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-t-3xl border-t border-gray-200 dark:border-[#8b5cf6]/30 max-h-[85%]`}>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white mb-4`}>Attendance Correction ({regularizeDate})</Text>

                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Clock In Time (e.g. 09:00 AM)</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
                                            value={inInputText}
                                            onChangeText={setInInputText}
                                        />
                                    </View>

                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Clock Out Time (e.g. 06:00 PM)</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
                                            value={outInputText}
                                            onChangeText={setOutInputText}
                                        />
                                    </View>

                                    <View style={tw`mb-6`}>
                                        <Text style={tw`text-xs font-bold text-gray-400 mb-1.5`}>Reason for correction *</Text>
                                        <TextInput
                                            style={tw`w-full px-4 py-2.5 bg-[#f5f3ff] dark:bg-[#1c1a45] border border-gray-300 dark:border-white/10 rounded-xl text-gray-800 dark:text-white`}
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
                                            style={tw`flex-1 py-3.5 bg-gray-100 dark:bg-[#1c1a45] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-gray-600 dark:text-gray-300 font-bold`}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={submitRegularization}
                                            disabled={submittingRequest}
                                            style={tw`flex-1 py-3.5 bg-[#8b5cf6] rounded-xl items-center`}
                                        >
                                            <Text style={tw`text-white font-bold`}>
                                                {submittingRequest ? 'Submitting...' : 'Submit'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Rejected Request Detail Modal */}
            <Modal
                visible={!!rejectedRequestToShow}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setRejectedRequestToShow(null)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black/60 px-4`}>
                    <View style={tw`bg-white dark:bg-[#1c1a45] rounded-[2.5rem] p-6 w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl relative overflow-hidden`}>
                        <View style={[tw`absolute top-0 left-0 right-0 h-2`, { backgroundColor: '#f43f5e' }]} />

                        <View style={tw`flex-row justify-between items-center mb-6 mt-2`}>
                            <View style={tw`flex-row items-center gap-2.5`}>
                                <View style={tw`p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl`}>
                                    <AlertCircle size={20} color="#f43f5e" />
                                </View>
                                <Text style={tw`text-lg font-black text-gray-900 dark:text-white`}>Correction Rejected</Text>
                            </View>
                            <TouchableOpacity onPress={() => setRejectedRequestToShow(null)} style={tw`p-1.5 bg-gray-50 dark:bg-white/5 rounded-xl`}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        {rejectedRequestToShow && (
                            <View style={tw`gap-4`}>
                                <View>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-450 uppercase tracking-wider mb-1.5`}>Date Requested</Text>
                                    <View style={tw`p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl`}>
                                        <Text style={tw`font-bold text-sm text-gray-800 dark:text-gray-200`}>
                                            {(() => {
                                                const dateStr = rejectedRequestToShow.date;
                                                if (!dateStr) return '';
                                                const d = new Date(dateStr);
                                                if (isNaN(d.getTime())) return dateStr;
                                                return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                            })()}
                                        </Text>
                                    </View>
                                </View>

                                <View style={tw`flex-row gap-4`}>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-450 uppercase tracking-wider mb-1.5`}>Proposed In Time</Text>
                                        <View style={tw`p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex-row items-center gap-1.5`}>
                                            <Clock size={14} color="#10b981" />
                                            <Text style={tw`text-sm font-semibold text-emerald-600 dark:text-emerald-400`}>
                                                {formatTime(rejectedRequestToShow.proposedIn || rejectedRequestToShow.inTime)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-455 uppercase tracking-wider mb-1.5`}>Proposed Out Time</Text>
                                        <View style={tw`p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex-row items-center gap-1.5`}>
                                            <Clock size={14} color="#ef4444" />
                                            <Text style={tw`text-sm font-semibold text-rose-500 dark:text-rose-400`}>
                                                {formatTime(rejectedRequestToShow.proposedOut || rejectedRequestToShow.outTime)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-455 uppercase tracking-wider mb-1.5`}>Your Reason</Text>
                                    <View style={tw`p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl`}>
                                        <Text style={tw`text-sm text-gray-600 dark:text-gray-300 italic font-semibold leading-relaxed`}>
                                            "{rejectedRequestToShow.reason}"
                                        </Text>
                                    </View>
                                </View>

                                <View>
                                    <Text style={tw`text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1.5`}>Manager's Rejection Reason</Text>
                                    <View style={tw`p-4 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-150 dark:border-rose-500/20 rounded-2xl shadow-sm`}>
                                        <Text style={tw`text-sm text-rose-700 dark:text-rose-300 font-bold leading-relaxed`}>
                                            {rejectedRequestToShow.approverComment || 'No comment provided.'}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setRejectedRequestToShow(null)}
                                    style={tw`w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl items-center shadow-lg shadow-rose-500/20 mt-2`}
                                >
                                    <Text style={tw`text-white font-bold text-sm tracking-wider uppercase`}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Rejected Leave Detail Modal */}
            <Modal
                visible={!!rejectedLeaveToShow}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setRejectedLeaveToShow(null)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black/60 px-4`}>
                    <View style={tw`bg-white dark:bg-[#1c1a45] rounded-[2.5rem] p-6 w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl relative overflow-hidden`}>
                        <View style={[tw`absolute top-0 left-0 right-0 h-2`, { backgroundColor: '#f43f5e' }]} />

                        <View style={tw`flex-row justify-between items-center mb-6 mt-2`}>
                            <View style={tw`flex-row items-center gap-2.5`}>
                                <View style={tw`p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl`}>
                                    <AlertCircle size={20} color="#f43f5e" />
                                </View>
                                <Text style={tw`text-lg font-black text-gray-900 dark:text-white`}>Leave Rejected</Text>
                            </View>
                            <TouchableOpacity onPress={() => setRejectedLeaveToShow(null)} style={tw`p-1.5 bg-gray-50 dark:bg-white/5 rounded-xl`}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        {rejectedLeaveToShow && (
                            <View style={tw`gap-4`}>
                                <View style={tw`flex-row gap-4`}>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-450 uppercase tracking-wider mb-1.5`}>Leave Type</Text>
                                        <View style={tw`p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl`}>
                                            <Text style={tw`font-bold text-sm text-gray-800 dark:text-gray-200`}>
                                                {rejectedLeaveToShow.leaveType?.name || 'Leave'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-455 uppercase tracking-wider mb-1.5`}>Dates</Text>
                                        <View style={tw`p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl`}>
                                            <Text style={tw`font-bold text-[10px] text-gray-800 dark:text-gray-200`}>
                                                {(() => {
                                                    const formatDate = (s: string) => {
                                                        const d = new Date(s);
                                                        if (isNaN(d.getTime())) return s;
                                                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                                    };
                                                    return `${formatDate(rejectedLeaveToShow.startDate)} - ${formatDate(rejectedLeaveToShow.endDate)}`;
                                                })()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 dark:text-gray-455 uppercase tracking-wider mb-1.5`}>Your Reason</Text>
                                    <View style={tw`p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl`}>
                                        <Text style={tw`text-sm text-gray-600 dark:text-gray-300 italic font-semibold leading-relaxed`}>
                                            "{rejectedLeaveToShow.reason}"
                                        </Text>
                                    </View>
                                </View>

                                <View>
                                    <Text style={tw`text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1.5`}>Manager's Rejection Reason</Text>
                                    <View style={tw`p-4 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-150 dark:border-rose-500/20 rounded-2xl shadow-sm`}>
                                        <Text style={tw`text-sm text-rose-700 dark:text-rose-300 font-bold leading-relaxed`}>
                                            {rejectedLeaveToShow.rejectionReason || 'No comment provided.'}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setRejectedLeaveToShow(null)}
                                    style={tw`w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl items-center shadow-lg shadow-rose-500/20 mt-2`}
                                >
                                    <Text style={tw`text-white font-bold text-sm tracking-wider uppercase`}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

        </View>
    );
}
