import { useState, useEffect, useCallback } from "react";

import { useAuth } from "../context/AuthContext";

import {
    DashboardStats,
    AttendanceChartData,
    PendingApproval,
    EmployeeOverview,
    PendingRegularization,
} from "../types/dashboard";

import {
    getAdminDashboardData,
} from "../services/dashboardService";

interface DashboardHookReturn {

    loading: boolean;

    refreshing: boolean;

    error: string | null;

    stats: DashboardStats;

    attendanceData: AttendanceChartData[];

    pendingApprovals: PendingApproval[];

    pendingRegularizations: PendingRegularization[];

    employees: EmployeeOverview[];

    refreshDashboard: () => Promise<void>;
}

export const useDashboard = (): DashboardHookReturn => {

    const { user } = useAuth();

    /**
     * =====================================================
     * Loading State
     * =====================================================
     */

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    /**
     * =====================================================
     * Dashboard States
     * =====================================================
     */

    const [stats, setStats] = useState<DashboardStats>({
        headcount: 0,
        onLeaveToday: 0,
        newJoiners: 0,
        avgAttendance: 0,
    });

    const [attendanceData, setAttendanceData] =
        useState<AttendanceChartData[]>([]);

    const [pendingApprovals, setPendingApprovals] =
        useState<PendingApproval[]>([]);

    const [pendingRegularizations, setPendingRegularizations] =
        useState<PendingRegularization[]>([]);

    const [employees, setEmployees] =
        useState<EmployeeOverview[]>([]);

    /**
     * =====================================================
     * Fetch Dashboard Data
     * =====================================================
     */

    const fetchDashboard = useCallback(async () => {

        /**
         * Employee Dashboard
         * doesn't require Admin APIs.
         */

        if (
            user?.role === "EMPLOYEE" ||
            user?.role === "MANAGER"
        ) {
            setLoading(false);
            return;
        }

        try {

            setError(null);

            const dashboard =
                await getAdminDashboardData();

            // if (!dashboard) return;

            setStats(dashboard.stats);

            setAttendanceData(
                dashboard.attendanceData
            );

            setPendingApprovals(
                dashboard.pendingApprovals
            );

            setPendingRegularizations(
                dashboard.pendingRegularizations
            );

            setEmployees(
                dashboard.employees
            );

        } catch (err: any) {

            console.error("Dashboard Error:", err);

            setError(
                err?.message ??
                "Failed to load dashboard."
            );

        } finally {

            setLoading(false);

            setRefreshing(false);
        }

    }, [user]);

    /**
     * =====================================================
     * Initial Load
     * =====================================================
     */

    useEffect(() => {

        if (user) {

            fetchDashboard();

        }

    }, [user, fetchDashboard]);

    /**
     * =====================================================
     * Pull To Refresh
     * =====================================================
     */

    const refreshDashboard = async () => {

        setRefreshing(true);

        await fetchDashboard();

    };

    /**
     * =====================================================
     * Return everything to Screen
     * =====================================================
     */

    return {

        loading,

        refreshing,

        error,

        stats,

        attendanceData,

        pendingApprovals,

        pendingRegularizations,

        employees,

        refreshDashboard,

    };

};

export default useDashboard;