import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Clock, Calendar, History, ArrowRight, CheckCircle2, AlertCircle, LogIn, LogOut } from 'lucide-react-native';
import api from '../../utils/api';
import tw from 'twrnc';

export default function EmployeeDashboard({ user, navigation }: { user: any, navigation: any }) {
    const [loading, setLoading] = useState(true);
    const [punchStatus, setPunchStatus] = useState<any>(null);
    const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);

    const fetchEmployeeData = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        try {
            // Fetch each resource individually to handle partial failures
            const [statusRes, leaveRes, historyRes, holidayRes] = await Promise.allSettled([
                api.get('/attendance/status'),
                api.get('/leave/balances'),
                api.get(`/attendance/history?year=${year}&month=${month}`),
                api.get('/masters/holidays')
            ]);

            if (statusRes.status === 'fulfilled') setPunchStatus(statusRes.value.data);
            if (leaveRes.status === 'fulfilled') setLeaveBalances(leaveRes.value.data);
            if (historyRes.status === 'fulfilled') setRecentAttendance(historyRes.value.data.slice(0, 5));
            if (holidayRes.status === 'fulfilled') setHolidays(holidayRes.value.data);

        } catch (error) {
            console.error("Failed to fetch employee dashboard data:", error);
            Alert.alert("Error", "Some dashboard data failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
    }, []);

    const handlePunch = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        try {
            const res = await api.post('/attendance/punch');
            setPunchStatus(res.data.record ? {
                isPunchedIn: res.data.record.inTime && !res.data.record.outTime,
                punchInTime: res.data.record.inTime,
                punchOutTime: res.data.record.outTime,
                status: res.data.record.status
            } : res.data);

            Alert.alert("Success", res.data.message || 'Action successful');

            // Refresh history with correct parameters
            const historyRes = await api.get(`/attendance/history?year=${year}&month=${month}`);
            setRecentAttendance(historyRes.data.slice(0, 5));
        } catch (error: any) {
            console.error("Punch error:", error);
            Alert.alert("Punch Failed", error.response?.data?.message || "Punch action failed");
        }
    };

    if (loading) {
        return (
            <View style={tw`flex-1 items-center justify-center min-h-[400px]`}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    const totalLeaves = leaveBalances.reduce((acc, curr) => acc + curr.balance, 0);
    const isPunchedIn = punchStatus?.isPunchedIn;
    const hasPunchedOut = !!punchStatus?.punchOutTime;
    const isShiftCompleted = !isPunchedIn && hasPunchedOut;

    // Holiday Check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayHoliday = holidays.find(h => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        return hDate.getTime() === today.getTime();
    });

    const isHolidayToday = !!todayHoliday;

    return (
        <ScrollView style={tw`flex-1 px-4 py-4`} contentContainerStyle={tw`pb-12`}>
            
            {/* GREETING SECTION */}
            <View style={tw`bg-[#8b5cf6] rounded-[2rem] p-6 text-white shadow-lg mb-6`}>
                <Text style={tw`text-2xl font-extrabold mb-1`}>Welcome, {user.name}!</Text>
                <Text style={tw`text-indigo-100 text-sm opacity-90 max-w-xs mb-6`}>Your personalized workspace is ready. Have a productive day!</Text>

                <View style={tw`flex-row flex-wrap gap-3`}>
                    <TouchableOpacity
                        onPress={handlePunch}
                        disabled={isShiftCompleted || isHolidayToday}
                        style={tw`flex-row items-center gap-2 px-5 py-3 rounded-2xl bg-white shadow-sm disabled:opacity-50`}
                        activeOpacity={0.8}
                    >
                        {isHolidayToday ? (
                            <Calendar size={18} color="#8b5cf6" />
                        ) : isPunchedIn ? (
                            <LogOut size={18} color="#8b5cf6" />
                        ) : (
                            <LogIn size={18} color="#22c55e" />
                        )}
                        <Text style={tw`font-bold text-sm text-gray-900`}>
                            {isHolidayToday ? 'Holiday Today' : isPunchedIn ? 'Punch Out Now' : isShiftCompleted ? 'Shift Completed' : 'Punch In Now'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Leave')}
                        style={tw`flex-row items-center gap-2 px-5 py-3 bg-white/20 rounded-2xl`}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-white font-bold text-sm`}>Apply Leave</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* QUICK STATS */}
            <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Attendance')}
                    style={tw`w-[47%] bg-white dark:bg-[#12112b] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}
                >
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <View style={tw`p-2 bg-blue-50 dark:bg-[#1c1a45] rounded-xl`}>
                            <Clock size={18} color="#3b82f6" />
                        </View>
                        <Text style={tw`text-[9px] font-bold text-gray-400 uppercase tracking-widest`}>Attendance</Text>
                    </View>
                    <Text style={tw`text-[10px] text-gray-400`}>Punch Status</Text>
                    <Text style={tw`text-sm font-bold text-gray-800 dark:text-white mt-0.5`}>
                        {punchStatus?.isPunchedIn ? 'Working' : 'Not Punched In'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigation.navigate('Leave')}
                    style={tw`w-[47%] bg-white dark:bg-[#12112b] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}
                >
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <View style={tw`p-2 bg-[#f5f3ff] dark:bg-[#1c1a45] rounded-xl`}>
                            <Calendar size={18} color="#8b5cf6" />
                        </View>
                        <Text style={tw`text-[9px] font-bold text-gray-400 uppercase tracking-widest`}>Leaves</Text>
                    </View>
                    <Text style={tw`text-[10px] text-gray-400`}>Remaining Balance</Text>
                    <Text style={tw`text-sm font-bold text-gray-800 dark:text-white mt-0.5`}>{totalLeaves} Days</Text>
                </TouchableOpacity>

                <View style={tw`w-full bg-white dark:bg-[#12112b] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <View style={tw`p-2 bg-purple-50 dark:bg-[#1c1a45] rounded-xl`}>
                            <History size={18} color="#a855f7" />
                        </View>
                        <Text style={tw`text-[9px] font-bold text-gray-400 uppercase tracking-widest`}>Holidays</Text>
                    </View>
                    {(() => {
                        const nextHoliday = [...holidays]
                            .filter(h => {
                                const hDate = new Date(h.date);
                                hDate.setHours(0, 0, 0, 0);
                                return hDate >= today;
                            })
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                        if (!nextHoliday) {
                            return (
                                <View>
                                    <Text style={tw`text-[10px] text-gray-400`}>Holiday</Text>
                                    <Text style={tw`text-sm font-bold text-gray-400 mt-0.5`}>No holidays scheduled</Text>
                                </View>
                            );
                        }

                        const hDate = new Date(nextHoliday.date);
                        return (
                            <View>
                                <Text style={tw`text-[10px] text-gray-400`}>Next Holiday</Text>
                                <Text style={tw`text-sm font-bold text-gray-850 dark:text-white mt-0.5`}>
                                    {nextHoliday.name}
                                </Text>
                                <Text style={tw`text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-1 uppercase`}>
                                    {hDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                        );
                    })()}
                </View>
            </View>

            {/* RECENT ACTIVITY */}
            <View style={tw`bg-white dark:bg-[#12112b] rounded-3xl p-5 border border-gray-100 dark:border-white/5 shadow-sm mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-lg font-bold text-gray-800 dark:text-white`}>My Recent Activity</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
                        <Text style={tw`text-xs font-bold text-[#8b5cf6] dark:text-[#c4b5fd]`}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={tw`space-y-3`}>
                    {recentAttendance.length > 0 ? recentAttendance.map((log, index) => (
                        <View key={index} style={tw`flex-row items-center justify-between p-3.5 bg-[#f5f3ff] dark:bg-white/5 rounded-2xl mb-2`}>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-9 h-9 rounded-xl bg-white dark:bg-[#1c1a45] flex items-center justify-center mr-3`}>
                                    <Clock size={16} color="#94a3b8" />
                                </View>
                                <View>
                                    <Text style={tw`text-xs font-bold text-gray-800 dark:text-white`}>{new Date(log.date).toLocaleDateString()}</Text>
                                    <Text style={tw`text-[10px] text-gray-400`}>{log.totalHours || '0'} hrs worked</Text>
                                </View>
                            </View>
                            <View style={tw`items-end`}>
                                <View style={tw`px-2.5 py-0.5 bg-green-50 dark:bg-green-950/20 rounded-full`}>
                                    <Text style={tw`text-[9px] font-bold text-green-600 dark:text-green-400`}>
                                        {log.status || 'Present'}
                                    </Text>
                                </View>
                                <Text style={tw`text-[9px] text-gray-450 mt-0.5`}>{log.clockIn} - {log.clockOut || '---'}</Text>
                            </View>
                        </View>
                    )) : (
                        <Text style={tw`text-center py-6 text-gray-400 text-sm`}>No recent activity found.</Text>
                    )}
                </View>
            </View>

            {/* PROFILE PREVIEW */}
            <View style={tw`bg-slate-900 rounded-3xl p-6 text-white`}>
                <Text style={tw`text-lg font-bold text-white mb-4`}>My Profile</Text>

                <View style={tw`flex-row items-center mb-6`}>
                    <View style={tw`w-14 h-14 rounded-2xl bg-[#8b5cf6] flex items-center justify-center mr-4`}>
                        <Text style={tw`text-white font-bold text-lg`}>{user.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={tw`text-sm font-bold text-white`}>{user.name}</Text>
                        <Text style={tw`text-[10px] font-black text-gray-400 uppercase mt-0.5`}>{user.role}</Text>
                    </View>
                </View>

                <View style={tw`space-y-2 mb-6`}>
                    <View style={tw`flex-row items-center gap-2 mb-1`}>
                        <CheckCircle2 size={14} color="#8b5cf6" />
                        <Text style={tw`text-xs text-gray-300`}>Employee ID: EMP{user.id.toString().padStart(4, '0')}</Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                        <AlertCircle size={14} color="#8b5cf6" />
                        <Text style={tw`text-xs text-gray-300`}>{user.email}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('EmployeeStack', { screen: 'EmployeeProfile', params: { id: user.id } })}
                    style={tw`w-full py-3.5 bg-[#8b5cf6] rounded-2xl flex-row items-center justify-center gap-2`}
                >
                    <Text style={tw`text-white font-bold text-sm`}>View Full Profile</Text>
                    <ArrowRight size={16} color="white" />
                </TouchableOpacity>
            </View>
            
        </ScrollView>
    );
}
