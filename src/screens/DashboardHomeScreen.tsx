/**
 * ============================================================================
 * Dashboard Home Screen
 * ============================================================================
 *
 * Responsibilities
 * ----------------
 * ✓ Display Dashboard
 * ✓ Display Loader
 * ✓ Display Error
 * ✓ Display Employee Dashboard
 * ✓ Display Admin Dashboard
 *
 * This screen DOES NOT make API calls.
 * All business logic lives inside useDashboard().
 *
 * ============================================================================
 */

import React from "react";
import {
    View,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";

import tw from "twrnc";

import CustomHeader from "../components/CustomHeader";

import AdminDashboard from "../components/dashboard/AdminDashboard";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";

import { useAuth } from "../context/AuthContext";

import useDashboard from "../hooks/useDashboard";

export default function DashboardHomeScreen({ navigation }: any) {

    /**
     * Logged-in User
     */
    const { user } = useAuth();

    /**
     * Dashboard Hook
     */
    const {
        loading,
        refreshing,
        error,
        stats,
        attendanceData,
        pendingApprovals,
        pendingRegularizations,
        employees,
        refreshDashboard,
    } = useDashboard();

    /**
     * Show Loader
     */
    if (loading) {
        return (
            <View
                style={tw`flex-1 items-center justify-center bg-gray-50 dark:bg-slate-900`}
            >
                <ActivityIndicator
                    size="large"
                    color="#6366F1"
                />
            </View>
        );
    }

    /**
     * Show Error Screen
     */
    if (error) {
        return (
            <View
                style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}
            >
                <CustomHeader
                    navigation={navigation}
                    title="Dashboard"
                />

                <View
                    style={tw`flex-1 items-center justify-center px-6`}
                >
                    <Text
                        style={tw`text-lg font-bold text-red-600 mb-3`}
                    >
                        Failed to Load Dashboard
                    </Text>

                    <Text
                        style={tw`text-center text-gray-500 mb-6`}
                    >
                        {error}
                    </Text>

                    <TouchableOpacity
                        onPress={refreshDashboard}
                        style={tw`bg-indigo-600 px-6 py-3 rounded-xl`}
                    >
                        <Text
                            style={tw`text-white font-bold`}
                        >
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    /**
     * User Role
     */
    const role = String(user?.role || "").toUpperCase();

    return (
        <View
            style={tw`flex-1 bg-gray-50 dark:bg-slate-900`}
        >
            {/* ============================================================
                 Header
            ============================================================ */}

            <CustomHeader
                navigation={navigation}
                title="Dashboard"
            />

            {/* ============================================================
                 Dashboard Content
            ============================================================ */}

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshDashboard}
                    />
                }
            >
                {
                    role === "EMPLOYEE" ||
                        role === "MANAGER" ? (

                        <EmployeeDashboard
                            navigation={navigation}
                            user={user}
                        />

                    ) : (

                        <AdminDashboard
                            navigation={navigation}
                            stats={stats}
                            attendanceData={attendanceData}
                            pendingApprovals={pendingApprovals}
                            pendingRegularizations={
                                pendingRegularizations
                            }
                            employees={employees}
                        />

                    )
                }
            </ScrollView>
        </View>
    );
}