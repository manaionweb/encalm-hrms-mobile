import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, UserMinus, UserCheck, Clock } from 'lucide-react-native';
import tw from 'twrnc';

interface HeadcountStatsProps {
    headcount: number | string;
    onLeaveToday: number | string;
    newJoiners: number | string;
    avgAttendance: number | string;
    navigation: any;
}

export default function HeadcountStats({ headcount, onLeaveToday, newJoiners, avgAttendance, navigation }: HeadcountStatsProps) {
    const stats = [
        { label: 'TOTAL EMPLOYEES', value: headcount, icon: Users, color: '#6366f1', bg: 'bg-indigo-50', path: 'EmployeeStack', screen: 'EmployeeList' },
        { label: 'On Leave Today', value: onLeaveToday, icon: UserMinus, color: '#f97316', bg: 'bg-orange-50', path: 'Leave', screen: 'LeaveToday' },
        { label: 'New Joiners', value: newJoiners, icon: UserCheck, color: '#22c55e', bg: 'bg-green-50', path: 'EmployeeStack', screen: 'EmployeeList' }, // or navigate to Joiners if exists
        { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: Clock, color: '#3b82f6', bg: 'bg-blue-50', path: 'Attendance', screen: 'Attendance' },
    ];

    return (
        <View style={tw`flex-row flex-wrap justify-between mb-6`}>
            {stats.map((stat, index) => (
                <TouchableOpacity 
                    key={index} 
                    onPress={() => {
                        if (stat.path) {
                            navigation.navigate(stat.path, { screen: stat.screen });
                        }
                    }}
                    activeOpacity={0.8}
                    style={tw`w-[47%] bg-white dark:bg-slate-800 p-4 rounded-3xl mb-4 border border-gray-100 dark:border-slate-700 shadow-sm`}
                >
                    <View style={tw`flex-row justify-between items-start`}>
                        <View style={tw`flex-1 mr-2`}>
                            <Text style={tw`text-gray-400 dark:text-gray-400 text-[10px] font-bold tracking-wide uppercase`}>{stat.label}</Text>
                            <Text style={tw`text-2xl font-black text-gray-900 dark:text-white mt-1`}>{stat.value}</Text>
                        </View>
                        <View style={[tw`p-2.5 rounded-2xl ${stat.bg} dark:bg-slate-700/50`]}>
                            <stat.icon size={20} color={stat.color} />
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}
