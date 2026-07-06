import React from "react";
import { View, Text } from "react-native";
import {
    Users,
    UserMinus,
    UserPlus,
    BarChart3,
} from "lucide-react-native";
import tw from "twrnc";

import { DashboardStats as DashboardStatsType } from "../../types/dashboard";

interface Props {
    stats: DashboardStatsType;
}

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

const StatCard = ({
    title,
    value,
    icon,
    color,
}: StatCardProps) => {

    return (
        <View
            style={tw`w-[48%] bg-white dark:bg-[#12112b] rounded-2xl p-4 mb-4 shadow`}
        >
            <View
                style={tw`flex-row justify-between items-center`}
            >
                <View
                    style={[
                        tw`w-11 h-11 rounded-xl items-center justify-center`,
                        {
                            backgroundColor: color + "20",
                        },
                    ]}
                >
                    {icon}
                </View>

                <Text
                    style={tw`text-2xl font-extrabold text-gray-900 dark:text-white`}
                >
                    {value}
                </Text>
            </View>

            <Text
                style={tw`mt-4 text-sm text-gray-500 dark:text-gray-400 font-semibold`}
            >
                {title}
            </Text>
        </View>
    );
};

export default function DashboardStats({
    stats,
}: Props) {

    return (

        <View style={tw`px-4 mt-4`}>

            <View
                style={tw`flex-row flex-wrap justify-between`}
            >

                <StatCard
                    title="Headcount"
                    value={stats.headcount}
                    color="#3B82F6"
                    icon={
                        <Users
                            size={22}
                            color="#3B82F6"
                        />
                    }
                />

                <StatCard
                    title="On Leave"
                    value={stats.onLeaveToday}
                    color="#F97316"
                    icon={
                        <UserMinus
                            size={22}
                            color="#F97316"
                        />
                    }
                />

                <StatCard
                    title="New Joiners"
                    value={stats.newJoiners}
                    color="#10B981"
                    icon={
                        <UserPlus
                            size={22}
                            color="#10B981"
                        />
                    }
                />

                <StatCard
                    title="Attendance"
                    value={`${stats.avgAttendance}%`}
                    color="#8B5CF6"
                    icon={
                        <BarChart3
                            size={22}
                            color="#8B5CF6"
                        />
                    }
                />

            </View>

        </View>

    );

}