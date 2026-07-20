import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import tw from 'twrnc';

interface LiveAttendanceProps {
    data: { name: string; visitors: number }[];
}

export default function LiveAttendance({ data }: LiveAttendanceProps) {
    const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
    const [chartWidth, setChartWidth] = useState(0);

    // Find the maximum value to scale heights
    const maxVal = data && data.length > 0 ? Math.max(...data.map(d => d.visitors), 1) : 10;

    // Get color theme based on attendance category name
    const getBarColor = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('present') || lowerName.includes('check-in')) return 'bg-[#8b5cf6]';
        if (lowerName.includes('late')) return 'bg-amber-500';
        if (lowerName.includes('absent')) return 'bg-rose-500';
        if (lowerName.includes('leave')) return 'bg-emerald-500';
        return 'bg-[#8b5cf6]';
    };

    const getBgColor = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('present') || lowerName.includes('check-in')) return 'bg-[#f5f3ff] dark:bg-indigo-950/20';
        if (lowerName.includes('late')) return 'bg-amber-50 dark:bg-amber-950/20';
        if (lowerName.includes('absent')) return 'bg-rose-50 dark:bg-rose-950/20';
        if (lowerName.includes('leave')) return 'bg-emerald-50 dark:bg-emerald-950/20';
        return 'bg-slate-50 dark:bg-slate-700/30';
    };

    // Calculate active bar index on touch drag or mouse move
    const handleTouch = (event: any) => {
        if (chartWidth === 0 || !data || data.length === 0) return;
        const nativeEvent = event.nativeEvent || {};

        // Support both React Native mobile coordinates and Expo Web browser offsets
        const locationX = typeof nativeEvent.locationX !== 'undefined'
            ? nativeEvent.locationX
            : (typeof nativeEvent.offsetX !== 'undefined' ? nativeEvent.offsetX : 0);

        const index = Math.floor((locationX / chartWidth) * data.length);
        const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
        setSelectedBarIndex(clampedIndex);
    };

    const handleRelease = () => {
        setSelectedBarIndex(null);
    };

    // Inject mouse listeners dynamically for web browser runtimes (localhost:8081)
    const webProps = Platform.OS === 'web' ? {
        onMouseMove: handleTouch,
        onMouseLeave: handleRelease
    } : {};

    return (
        <View style={tw`bg-white dark:bg-[#1a2235] p-5 rounded-[2rem] border border-gray-100 dark:border-[#374151]/50 shadow-sm mb-6`}>
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

            {/* Custom Bar Chart View with scrollable track and Touch-Drag Responder */}
            <View style={tw`h-44`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`pr-1`}
                >
                    <View
                        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
                        {...webProps}
                        style={tw`flex-row items-end h-40 pb-1`}
                    >
                        {data.map((item, index) => {
                            const pct = (item.visitors / maxVal) * 100;
                            const heightVal = pct > 0 ? `${Math.max(pct, 8)}%` : '4%';
                            const barColor = getBarColor(item.name);
                            const bgColor = getBgColor(item.name);

                            return (
                                <View
                                    key={index}
                                    pointerEvents="none"
                                    style={tw`items-center w-10 mx-1.5 relative`}
                                >
                                    {/* Value Above Bar (only show if > 0) */}
                                    <Text style={tw`text-[10px] font-bold mb-1.5 ${item.visitors > 0 ? 'text-[#8b5cf6] dark:text-[#c4b5fd]' : 'text-transparent'}`}>
                                        {item.visitors}
                                    </Text>
                                    
                                    {/* Bar Track & Fill */}
                                    <View style={tw`w-4 h-24 ${selectedBarIndex === index ? 'bg-[#8b5cf6]/20' : bgColor} rounded-full justify-end overflow-hidden border ${selectedBarIndex === index ? 'border-[#8b5cf6]' : 'border-transparent'}`}>
                                        <View style={[tw`w-full ${barColor} rounded-full`, { height: heightVal }]} />
                                    </View>

                                    {/* Hour Label */}
                                    <Text style={tw`text-[9.5px] font-bold ${selectedBarIndex === index ? 'text-[#8b5cf6] dark:text-[#c4b5fd]' : 'text-gray-400 dark:text-gray-500'} mt-2.5`}>
                                        {item.name}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}
