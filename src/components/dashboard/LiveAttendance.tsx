import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

interface LiveAttendanceProps {
    data: { name: string; visitors: number }[];
}

export default function LiveAttendance({ data }: LiveAttendanceProps) {
    // Find the maximum value to scale heights
    const maxVal = data && data.length > 0 ? Math.max(...data.map(d => d.visitors), 1) : 10;

    // Get color theme based on attendance category name
    const getBarColor = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('present') || lowerName.includes('check-in')) return 'bg-indigo-500';
        if (lowerName.includes('late')) return 'bg-amber-500';
        if (lowerName.includes('absent')) return 'bg-rose-500';
        if (lowerName.includes('leave')) return 'bg-emerald-500';
        return 'bg-indigo-500';
    };

    const getBgColor = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('present') || lowerName.includes('check-in')) return 'bg-indigo-50 dark:bg-indigo-950/20';
        if (lowerName.includes('late')) return 'bg-amber-50 dark:bg-amber-950/20';
        if (lowerName.includes('absent')) return 'bg-rose-50 dark:bg-rose-950/20';
        if (lowerName.includes('leave')) return 'bg-emerald-50 dark:bg-emerald-950/20';
        return 'bg-slate-50 dark:bg-slate-700/30';
    };

    return (
        <View style={tw`bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
                <View>
                    <Text style={tw`text-base font-black text-gray-900 dark:text-white`}>Live Attendance</Text>
                    <Text style={tw`text-xs text-gray-400 mt-0.5`}>Real-time check-ins today</Text>
                </View>
                <View style={tw`flex-row items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 rounded-full`}>
                    <View style={tw`w-1.5 h-1.5 bg-green-500 rounded-full`} />
                    <Text style={tw`text-[9px] font-bold text-green-600 dark:text-green-400 tracking-wider uppercase`}>Live</Text>
                </View>
            </View>

            {/* Custom Bar Chart View */}
            <View style={tw`flex-row justify-between items-end h-44 px-1`}>
                {data.map((item, index) => {
                    const pct = (item.visitors / maxVal) * 100;
                    const heightVal = pct > 0 ? `${Math.max(pct, 8)}%` : '4%';
                    const barColor = getBarColor(item.name);
                    const bgColor = getBgColor(item.name);

                    return (
                        <View key={index} style={tw`items-center flex-1 mx-1.5`}>
                            {/* Value Above Bar */}
                            <Text style={tw`text-[10px] font-black text-gray-800 dark:text-gray-200 mb-1.5`}>{item.visitors}</Text>
                            
                            {/* Bar Track & Fill */}
                            <View style={tw`w-6.5 h-28 ${bgColor} rounded-full justify-end overflow-hidden`}>
                                <View style={[tw`w-full ${barColor} rounded-full`, { height: heightVal }]} />
                            </View>

                            {/* Label */}
                            <Text style={tw`text-[9.5px] font-bold text-gray-500 dark:text-gray-400 mt-3`} numberOfLines={1}>
                                {item.name}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
