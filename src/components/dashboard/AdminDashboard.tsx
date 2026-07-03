import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import HeadcountStats from './HeadcountStats';
import LiveAttendance from './LiveAttendance';
import tw from 'twrnc';

interface AdminDashboardProps {
    navigation: any;
    stats: any;
    attendanceData: any[];
    pendingApprovals: any[];
    pendingRegularizations: any[];
    employees: any[];
}

export default function AdminDashboard({
    navigation,
    stats,
    attendanceData,
    pendingApprovals,
    pendingRegularizations = [],
    employees
}: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<'leaves' | 'regularizations'>('leaves');

    return (
        <ScrollView style={tw`flex-1 px-4 py-4`} contentContainerStyle={tw`pb-12`}>

            {/* Header */}
            <View style={tw`mb-6`}>
                <Text style={tw`text-2xl font-black text-gray-900 dark:text-white`}>Admin Dashboard</Text>
                <Text style={tw`text-sm text-gray-500 dark:text-gray-400 mt-1`}>
                    Welcome HR Admin, here's the organizational overview.
                </Text>
            </View>

            {/* Action Required Regularization Alert */}
            {pendingRegularizations.length > 0 && (
                <View style={tw`bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 rounded-3xl p-4 mb-6`}>
                    <View style={tw`flex-row items-start mb-3`}>
                        <View style={tw`p-2 bg-white dark:bg-slate-700 rounded-2xl shadow-sm mr-3`}>
                            <AlertCircle color="#ea580c" size={20} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-bold text-orange-950 dark:text-orange-200 text-sm`}>Action Required</Text>
                            <Text style={tw`text-xs text-orange-700 dark:text-orange-300 mt-0.5`}>
                                There are {pendingRegularizations.length} pending attendance regularization requests waiting for your review.
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setActiveTab('regularizations');
                            // Navigate directly to Regularizations
                            navigation.navigate('EmployeeStack', { screen: 'Regularizations' });
                        }}
                        style={tw`bg-orange-600 rounded-xl py-2 items-center`}
                    >
                        <Text style={tw`text-white font-bold text-xs`}>Review Corrections</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Stats Grid */}
            <HeadcountStats {...stats} navigation={navigation} />

            {/* Live Attendance Chart */}
            <LiveAttendance data={attendanceData} />

            {/* Approval Center */}
            <View style={tw`bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-lg font-bold text-gray-900 dark:text-white`}>Approval Center</Text>
                    <View style={tw`bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full`}>
                        <Text style={tw`text-indigo-600 dark:text-indigo-400 text-xs font-bold`}>
                            {activeTab === 'leaves' ? pendingApprovals.length : pendingRegularizations.length}
                        </Text>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={tw`flex-row border-b border-gray-100 dark:border-slate-700 mb-4`}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('leaves')}
                        style={tw`flex-1 pb-2 items-center ${activeTab === 'leaves' ? 'border-b-2 border-indigo-600' : ''}`}
                    >
                        <Text style={tw`text-xs font-bold uppercase tracking-wider ${activeTab === 'leaves' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                            Leaves ({pendingApprovals.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('regularizations')}
                        style={tw`flex-1 pb-2 items-center ${activeTab === 'regularizations' ? 'border-b-2 border-indigo-600' : ''}`}
                    >
                        <Text style={tw`text-xs font-bold uppercase tracking-wider ${activeTab === 'regularizations' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                            Corrections ({pendingRegularizations.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Approvals List */}
                <View style={tw`max-h-70`}>
                    {activeTab === 'leaves' ? (
                        pendingApprovals.length === 0 ? (
                            <Text style={tw`text-sm text-gray-400 text-center py-6 font-semibold`}>No pending leaves.</Text>
                        ) : (
                            pendingApprovals.map((approval) => (
                                <View
                                    key={approval.id}
                                    style={tw`flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700/50`}
                                >
                                    <View style={tw`flex-row items-center flex-1 mr-2`}>
                                        <View style={tw`w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center mr-3`}>
                                            <Text style={tw`text-indigo-600 dark:text-indigo-400 font-bold text-xs`}>
                                                {approval.userName.substring(0, 2).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>{approval.userName}</Text>
                                            <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                                                {approval.type} • {approval.duration} days
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Leave', { activeTab: 'APPROVALS' })}
                                        style={tw`bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl`}
                                    >
                                        <Text style={tw`text-[10px] font-bold text-indigo-600 dark:text-indigo-400`}>Review</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )
                    ) : (
                        pendingRegularizations.length === 0 ? (
                            <Text style={tw`text-sm text-gray-400 text-center py-6 font-semibold`}>No pending corrections.</Text>
                        ) : (
                            pendingRegularizations.map((request) => {
                                const name = request.user?.name || `Employee #${request.userId}`;
                                return (
                                    <View
                                        key={request.id}
                                        style={tw`flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700/50`}
                                    >
                                        <View style={tw`flex-row items-center flex-1 mr-2`}>
                                            <View style={tw`w-9 h-9 rounded-xl bg-orange-50 dark:bg-slate-700 flex items-center justify-center mr-3`}>
                                                <Text style={tw`text-orange-600 dark:text-orange-400 font-bold text-xs`}>
                                                    {name.substring(0, 2).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>{name}</Text>
                                                <Text style={tw`text-[10px] text-gray-400`}>
                                                    {new Date(request.date).toLocaleDateString()}
                                                </Text>

                                                <Text
                                                    numberOfLines={1}
                                                    style={tw`text-[10px] text-orange-500`}
                                                >
                                                    {request.reason}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('EmployeeStack', { screen: 'Regularizations' })}
                                            style={tw`bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl`}
                                        >
                                            <Text style={tw`text-[10px] font-bold text-indigo-600 dark:text-indigo-400`}>Review</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )
                    )}
                </View>
            </View>

            {/* Employee Overview List */}
            <View style={tw`mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-lg font-black text-gray-900 dark:text-white`}>Employee Overview</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('EmployeeStack', { screen: 'EmployeeList' })}>
                        <Text style={tw`text-xs font-bold text-indigo-600 dark:text-indigo-400`}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={tw`bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-4`}>
                    {employees
                        .filter((emp) => emp.status !== 'Inactive' && emp.status?.toLowerCase() !== 'inactive')
                        .map((emp) => (
                            <TouchableOpacity
                                key={emp.id}
                                onPress={() => navigation.navigate('EmployeeStack', { screen: 'EmployeeProfile', params: { id: emp.id } })}
                                style={tw`flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0`}
                            >
                                <View style={tw`flex-row items-center flex-1 mr-2`}>
                                    <View style={tw`w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3`}>
                                        <Text style={tw`text-slate-600 dark:text-slate-300 font-bold text-xs`}>
                                            {emp.name.split(' ').map((n: string) => n[0]).join('')}
                                        </Text>
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-xs font-bold text-gray-900 dark:text-white`}>{emp.name}</Text>
                                        <Text style={tw`text-[10px] text-gray-500 dark:text-gray-400 mt-0.5`}>{emp.role}</Text>
                                    </View>
                                </View>
                                <View style={tw`items-end`}>
                                    <View style={tw`px-2.5 py-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-500/20 rounded-full`}>
                                        <Text style={tw`text-[9px] font-bold text-green-600 dark:text-green-400 uppercase`}>{emp.status}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                </View>
            </View>

        </ScrollView>
    );
}
