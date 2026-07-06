import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { FileText, TrendingUp, Users, DollarSign, Calendar, Clock } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../utils/api';
import CustomHeader from '../components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import tw from 'twrnc';

export default function ReportsScreen({ navigation }: any) {
    const [period, setPeriod] = useState('monthly');
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const options = [
        { value: 'weekly', label: 'Weekly', icon: Clock },
        { value: 'monthly', label: 'Monthly', icon: Calendar },
        { value: 'quarter', label: 'Quarter', icon: FileText },
        { value: 'annual', label: 'Annual', icon: Users }
    ];

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/dashboard', { params: { period } });
            setStats(res.data || {});
        } catch (err) {
            console.error('Reports dashboard API error:', err);
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
            
            // Build direct download URL with auth params
            // Note: Since we are using FileSystem, we download from the full backend URL
            const downloadUrl = `${api.defaults.baseURL}${endpoint}?period=${period}`;

            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            Alert.alert("Downloading", "Please wait while your report is being generated...");

            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (tenantId) headers['x-tenant-id'] = tenantId;

            const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
                headers
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Success", `Report saved successfully to ${uri}`);
            }
        } catch (error: any) {
            console.error('Download report failed:', error);
            Alert.alert('Error', 'Failed to generate and download report.');
        }
    };

    return (
        <View style={tw`flex-1 bg-[#f5f3ff] dark:bg-[#0B0A1F]`}>
            
            <CustomHeader navigation={navigation} title="Reports" />

            <ScrollView style={tw`flex-1 p-4`} contentContainerStyle={tw`pb-12`}>
                
                {/* Period Selector Tabs */}
                <View style={tw`flex-row justify-between mb-6 bg-white dark:bg-[#12112b] p-2 rounded-2xl border border-gray-100`}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => setPeriod(opt.value)}
                            style={tw`flex-1 py-2 items-center rounded-xl ${period === opt.value ? 'bg-[#8b5cf6]' : ''}`}
                        >
                            <Text style={tw`text-xs font-bold ${period === opt.value ? 'text-white' : 'text-gray-400'}`}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#8b5cf6" style={tw`py-10`} />
                ) : (
                    <View>
                        
                        {/* Reports Cards */}
                        <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                            <View style={tw`w-[47%] bg-white dark:bg-[#12112b] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}>
                                <View style={tw`p-2 bg-[#f5f3ff] dark:bg-[#1c1a45] rounded-xl self-start mb-3`}>
                                    <Users size={18} color="#8b5cf6" />
                                </View>
                                <Text style={tw`text-[10px] font-bold text-gray-450 uppercase`}>Headcount</Text>
                                <Text style={tw`text-xl font-black text-gray-900 dark:text-white mt-1`}>
                                    {stats.totalEmployees || 0}
                                </Text>
                            </View>

                            <View style={tw`w-[47%] bg-white dark:bg-[#12112b] p-4 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm`}>
                                <View style={tw`p-2 bg-green-50 dark:bg-[#1c1a45] rounded-xl self-start mb-3`}>
                                    <DollarSign size={18} color="#22c55e" />
                                </View>
                                <Text style={tw`text-[10px] font-bold text-gray-450 uppercase`}>Total Payroll</Text>
                                <Text style={tw`text-xl font-black text-gray-900 dark:text-white mt-1`}>
                                    INR {stats.totalPayroll || '0'}
                                </Text>
                            </View>
                        </View>

                        {/* Export Center */}
                        <Text style={tw`text-sm font-bold text-gray-900 dark:text-white mb-3`}>Report Downloads</Text>
                        
                        <TouchableOpacity
                            onPress={() => handleDownloadReport('/reports/attendance/export', 'Attendance-Report.csv')}
                            style={tw`bg-white dark:bg-[#12112b] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex-row items-center justify-between mb-4`}
                        >
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`p-2.5 bg-blue-50 dark:bg-[#1c1a45] rounded-2xl mr-3`}>
                                    <FileText size={20} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text style={tw`text-sm font-bold text-gray-800 dark:text-white`}>Attendance Report</Text>
                                    <Text style={tw`text-xs text-gray-450 mt-0.5`}>Download check-ins/outs spreadsheet</Text>
                                </View>
                            </View>
                            <TrendingUp size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleDownloadReport('/reports/payroll/export', 'Payroll-Report.csv')}
                            style={tw`bg-white dark:bg-[#12112b] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex-row items-center justify-between`}
                        >
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`p-2.5 bg-purple-50 dark:bg-[#1c1a45] rounded-2xl mr-3`}>
                                    <DollarSign size={20} color="#a855f7" />
                                </View>
                                <View>
                                    <Text style={tw`text-sm font-bold text-gray-800 dark:text-white`}>Payroll Compliance Report</Text>
                                    <Text style={tw`text-xs text-gray-450 mt-0.5`}>Download salary compliance details</Text>
                                </View>
                            </View>
                            <TrendingUp size={16} color="#94a3b8" />
                        </TouchableOpacity>

                    </View>
                )}

            </ScrollView>

        </View>
    );
}
