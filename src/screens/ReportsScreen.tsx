import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { FileText, TrendingUp, Users, DollarSign, Calendar, Clock, ChevronDown, Check } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import Svg, { Circle } from 'react-native-svg';
import { useToast } from '../context/ToastContext';

export default function ReportsScreen({ navigation }: any) {
    const { showToast } = useToast();
    const [period, setPeriod] = useState('monthly');
    const [stats, setStats] = useState<any>({});
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [payrollData, setPayrollData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    const options = [
        { value: 'weekly', label: 'This Week', icon: Clock },
        { value: 'monthly', label: 'This Month', icon: Calendar },
        { value: 'quarter', label: 'This Quarter', icon: FileText },
        { value: 'annual', label: 'This Year', icon: Users }
    ];

    const periodLabels: Record<string, string> = {
        weekly: 'This Week',
        monthly: 'This Month',
        quarter: 'This Quarter',
        annual: 'This Year'
    };

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const [dashboardRes, attendanceRes, payrollRes] = await Promise.all([
                api.get('/reports/dashboard', { params: { period } }),
                api.get('/reports/attendance', { params: { period } }),
                api.get('/reports/payroll', { params: { period } })
            ]);
            setStats(dashboardRes.data || {});
            setAttendanceData(attendanceRes.data || []);
            setPayrollData(payrollRes.data || []);
        } catch (err) {
            console.error('Reports data API error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportsData();
    }, [period]);

    const handleDownloadReport = async (endpoint: string, filename: string) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const tenantId = await AsyncStorage.getItem('tenantId');
            const downloadUrl = `${api.defaults.baseURL}${endpoint}?period=${period}`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            showToast("Generating report...", 'info', 2000);

            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (tenantId) headers['x-tenant-id'] = tenantId;

            const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
                headers
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                showToast(`Report saved successfully to ${uri}`, 'success');
            }
        } catch (error: any) {
            console.error('Download report failed:', error);
            showToast('Failed to generate and download report.', 'error');
        }
    };

    // Render stacked bar chart for Monthly Attendance
    const renderAttendanceChart = () => {
        if (!attendanceData || attendanceData.length === 0) {
            return (
                <View style={tw`h-40 justify-center items-center`}>
                    <Text style={tw`text-xs text-gray-400`}>No attendance data available</Text>
                </View>
            );
        }

        const maxVal = Math.max(
            ...attendanceData.map((d) => (d.present || 0) + (d.absent || 0)),
            10
        );

        return (
            <View style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-6`}>
                <Text style={tw`text-sm font-black text-gray-900 dark:text-white mb-4`}>Monthly Attendance</Text>
                
                <View style={tw`flex-row h-40 items-end justify-between px-2`}>
                    <View style={tw`absolute left-0 right-0 top-0 bottom-0 justify-between pointer-events-none`}>
                        <View style={tw`border-b border-dashed border-gray-100 dark:border-white/5 w-full h-0`} />
                        <View style={tw`border-b border-dashed border-gray-100 dark:border-white/5 w-full h-0`} />
                        <View style={tw`border-b border-dashed border-gray-100 dark:border-white/5 w-full h-0`} />
                        <View style={tw`border-b border-dashed border-gray-100 dark:border-white/5 w-full h-0`} />
                    </View>

                    {attendanceData.map((data, idx) => {
                        const total = (data.present || 0) + (data.absent || 0);
                        const presentPct = total > 0 ? (data.present / total) * 100 : 0;
                        const absentPct = total > 0 ? (data.absent / total) * 100 : 0;
                        const heightPct = (total / maxVal) * 80; // Scale to fit nicely

                        return (
                            <View key={idx} style={tw`items-center flex-1 h-full justify-end`}>
                                <View style={[tw`w-4 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 justify-end`, { height: `${Math.max(heightPct, 10)}%` }]}>
                                    {data.absent > 0 && (
                                        <View style={[tw`bg-rose-500 w-full`, { height: `${absentPct}%` }]} />
                                    )}
                                    {data.present > 0 && (
                                        <View style={[tw`bg-[#8b5cf6] w-full`, { height: `${presentPct}%` }]} />
                                    )}
                                </View>
                                <Text style={tw`text-[9px] text-gray-400 mt-2 font-bold`}>{data.name}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // Render donut chart for Department Payroll
    const renderPayrollChart = () => {
        if (!payrollData || payrollData.length === 0) {
            return (
                <View style={tw`h-40 justify-center items-center`}>
                    <Text style={tw`text-xs text-gray-400`}>No payroll data available</Text>
                </View>
            );
        }

        const totalPayrollSum = payrollData.reduce((sum, d) => sum + (d.value || 0), 0);
        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

        const size = 100;
        const strokeWidth = 12;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        let accumulatedPercent = 0;

        return (
            <View style={tw`bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-6`}>
                <Text style={tw`text-sm font-black text-gray-900 dark:text-white mb-4`}>Department Payroll</Text>
                
                <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`relative w-[100px] h-[100px] items-center justify-center`}>
                        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="rgba(148, 163, 184, 0.12)"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            
                            {payrollData.map((data, idx) => {
                                const percentage = totalPayrollSum > 0 ? data.value / totalPayrollSum : 0;
                                const strokeDashoffset = circumference - (percentage * circumference);
                                const strokeDasharray = `${circumference} ${circumference}`;
                                const rotationOffset = (accumulatedPercent / 100) * 360;
                                accumulatedPercent += percentage * 100;

                                return (
                                    <Circle
                                        key={idx}
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={colors[idx % colors.length]}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        transform={`rotate(${rotationOffset} ${size / 2} ${size / 2})`}
                                    />
                                );
                            })}
                        </Svg>
                        <View style={tw`absolute items-center justify-center`}>
                            <Text style={tw`text-[9px] font-black text-gray-400 uppercase`}>Total</Text>
                            <Text style={tw`text-[11px] font-black text-gray-900 dark:text-white`}>
                                ₹{totalPayrollSum >= 100000 ? `${(totalPayrollSum / 100000).toFixed(1)}L` : totalPayrollSum}
                            </Text>
                        </View>
                    </View>

                    <View style={tw`flex-1 ml-6 gap-2.5`}>
                        {payrollData.slice(0, 4).map((data, idx) => {
                            const pct = totalPayrollSum > 0 ? (data.value / totalPayrollSum) * 100 : 0;
                            return (
                                <View key={idx}>
                                    <View style={tw`flex-row justify-between items-center mb-1`}>
                                        <View style={tw`flex-row items-center`}>
                                            <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: colors[idx % colors.length] }]} />
                                            <Text style={tw`text-[10px] font-bold text-gray-700 dark:text-gray-300`} numberOfLines={1}>
                                                {data.name}
                                            </Text>
                                        </View>
                                        <Text style={tw`text-[9px] font-black text-gray-900 dark:text-white`}>
                                            {pct.toFixed(0)}%
                                        </Text>
                                    </View>
                                    <View style={tw`h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden`}>
                                        <View style={[tw`h-full rounded-full`, { width: `${pct}%`, backgroundColor: colors[idx % colors.length] }]} />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            <CustomHeader navigation={navigation} title="Reports & Analytics" />

            <ScrollView style={tw`flex-1 p-4`} contentContainerStyle={tw`pb-12`}>
                
                {/* Header title & Time period selector */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <View style={tw`flex-1 mr-2`}>
                        <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>Insights</Text>
                        <Text style={tw`text-sm font-black text-gray-900 dark:text-white`} numberOfLines={1}>
                            Workforce & Payroll Analytics
                        </Text>
                    </View>
                    
                    <TouchableOpacity
                        onPress={() => setShowDropdown(true)}
                        style={tw`flex-row items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#4c1d95] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm`}
                    >
                        <Calendar size={14} color="#8b5cf6" />
                        <Text style={tw`text-[11px] font-bold text-gray-800 dark:text-white`}>
                            {periodLabels[period]}
                        </Text>
                        <ChevronDown size={12} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#8b5cf6" style={tw`py-12`} />
                ) : (
                    <View>
                        
                        {/* Payroll Metric Card */}
                        <View style={tw`w-full bg-white dark:bg-[#4c1d95] p-5 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}>
                            <View style={tw`flex-row justify-between items-center mb-3`}>
                                <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>Total Payroll</Text>
                                <View style={tw`p-2 bg-green-50 dark:bg-green-950/20 rounded-xl`}>
                                    <DollarSign size={18} color="#22c55e" />
                                </View>
                            </View>
                            <Text style={tw`text-2xl font-black text-gray-900 dark:text-white`}>
                                ₹{stats.totalPayroll || 0}
                            </Text>
                            <View style={tw`flex-row items-center gap-1 mt-2`}>
                                <TrendingUp size={12} color="#22c55e" />
                                <Text style={tw`text-[10px] font-bold text-[#22c55e]`}>
                                    {stats.payrollGrowth || '+0%'} from last month
                                </Text>
                            </View>
                        </View>

                        {/* Attendance & Leaves Metric Cards */}
                        <View style={tw`flex-row justify-between mb-6`}>
                            <View style={tw`w-[48%] bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                                <View style={tw`flex-row justify-between items-center mb-3`}>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>Avg. Attendance</Text>
                                    <View style={tw`p-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl`}>
                                        <Users size={18} color="#3b82f6" />
                                    </View>
                                </View>
                                <Text style={tw`text-2xl font-black text-gray-900 dark:text-white`}>
                                    {stats.avgAttendance || 0}%
                                </Text>
                                <Text style={tw`text-[10px] font-bold text-blue-500 mt-2`}>
                                    {stats.attendanceTrend || 'Needs attention'}
                                </Text>
                            </View>

                            <View style={tw`w-[48%] bg-white dark:bg-[#4c1d95] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm`}>
                                <View style={tw`flex-row justify-between items-center mb-3`}>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>Pending Leaves</Text>
                                    <View style={tw`p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl`}>
                                        <Calendar size={18} color="#f59e0b" />
                                    </View>
                                </View>
                                <Text style={tw`text-2xl font-black text-gray-900 dark:text-white`}>
                                    {stats.pendingLeaves || 0}
                                </Text>
                                <Text style={tw`text-[10px] font-bold text-amber-500 mt-2`}>
                                    {stats.leaveStatus || 'No pending leaves'}
                                </Text>
                            </View>
                        </View>

                        {/* Attendance Chart */}
                        {renderAttendanceChart()}

                        {/* Payroll Chart */}
                        {renderPayrollChart()}

                        {/* Report Export Center inside a purple banner container matching web */}
                        <View style={tw`bg-[#8b5cf6] p-5 rounded-3xl mb-6 shadow-sm`}>
                            <Text style={tw`text-sm font-black text-white mb-4`}>Generate Reports</Text>
                            
                            <TouchableOpacity
                                onPress={() => handleDownloadReport('/reports/export/attendance', 'Attendance-Report.csv')}
                                style={tw`bg-white/10 p-4 rounded-3xl border border-white/5 shadow-sm flex-row items-center justify-between mb-4`}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`p-2.5 bg-white/20 rounded-2xl mr-3`}>
                                        <FileText size={20} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={tw`text-sm font-bold text-white`}>Monthly Attendance</Text>
                                        <Text style={tw`text-xs text-purple-100 mt-0.5`}>Download CSV</Text>
                                    </View>
                                </View>
                                <TrendingUp size={16} color="#fff" style={tw`opacity-70`} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDownloadReport('/reports/export/salary', 'Salary-Register.csv')}
                                style={tw`bg-white/10 p-4 rounded-3xl border border-white/5 shadow-sm flex-row items-center justify-between mb-4`}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`p-2.5 bg-white/20 rounded-2xl mr-3`}>
                                        <DollarSign size={20} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={tw`text-sm font-bold text-white`}>Monthly Salary Register</Text>
                                        <Text style={tw`text-xs text-purple-100 mt-0.5`}>Download CSV</Text>
                                    </View>
                                </View>
                                <TrendingUp size={16} color="#fff" style={tw`opacity-70`} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDownloadReport('/reports/export/leave', 'Leave-Balance.xlsx')}
                                style={tw`bg-white/10 p-4 rounded-3xl border border-white/5 shadow-sm flex-row items-center justify-between`}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`p-2.5 bg-white/20 rounded-2xl mr-3`}>
                                        <Calendar size={20} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={tw`text-sm font-bold text-white`}>Monthly Leave Balance</Text>
                                        <Text style={tw`text-xs text-purple-100 mt-0.5`}>Download Excel</Text>
                                    </View>
                                </View>
                                <TrendingUp size={16} color="#fff" style={tw`opacity-70`} />
                            </TouchableOpacity>
                        </View>

                    </View>
                )}

            </ScrollView>

            {/* Time Period Dropdown Modal */}
            <Modal
                visible={showDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
                    <View style={tw`flex-1 justify-center items-center bg-black/60 p-4`}>
                        <View style={tw`bg-white dark:bg-[#4c1d95] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl w-full max-w-sm`}>
                            <Text style={tw`text-base font-black text-gray-900 dark:text-white mb-4`}>Select Time Period</Text>
                            {options.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => {
                                        setPeriod(opt.value);
                                        setShowDropdown(false);
                                    }}
                                    style={tw`flex-row items-center justify-between py-3.5 border-b border-gray-50 dark:border-white/5 last:border-0`}
                                >
                                    <View style={tw`flex-row items-center gap-3`}>
                                        <opt.icon size={18} color={period === opt.value ? '#8b5cf6' : '#94a3b8'} />
                                        <Text style={tw`text-sm font-bold ${period === opt.value ? 'text-[#8b5cf6] dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {opt.label}
                                        </Text>
                                    </View>
                                    {period === opt.value && (
                                        <Check size={16} color="#8b5cf6" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </View>
    );
}
