/**
 * ========================================================================
 * Dashboard Service
 * ========================================================================
 *
 * Purpose:
 * --------
 * This file contains all Dashboard-related API calls.
 *
 * The UI (DashboardHomeScreen, AdminDashboard, etc.) should NEVER call
 * axios directly. Instead, they should use the functions exported here.
 *
 * Flow:
 *
 * Screen
 *    │
 *    ▼
 * Dashboard Service
 *    │
 *    ▼
 * Axios (utils/api.ts)
 *    │
 *    ▼
 * Express Backend
 *
 * Benefits:
 * ---------
 * ✔ Centralized API calls
 * ✔ Easier maintenance
 * ✔ Better error handling
 * ✔ Reusable across multiple screens
 * ✔ Cleaner UI code
 * ========================================================================
 */

import api from "../utils/api";

import {
    DashboardStats,
    AttendanceChartData,
    PendingApproval,
    EmployeeOverview,
    PendingRegularization,
} from "../types/dashboard";

/**
 * ========================================================================
 * Generic API Error Handler
 * ========================================================================
 *
 * Converts Axios errors into readable Error objects.
 *
 * Example:
 *
 * try {
 *     await getDashboardStats();
 * } catch(error) {
 *     Alert.alert(error.message);
 * }
 * ========================================================================
 */
const handleApiError = (error: any): Error => {

    console.error("Dashboard API Error:", error);

    if (error.response) {
        return new Error(
            error.response.data?.message ??
            "Server returned an unexpected error."
        );
    }

    if (error.request) {
        return new Error(
            "Unable to connect to the server."
        );
    }

    return new Error(
        error.message || "Something went wrong."
    );
};

/**
 * ========================================================================
 * GET DASHBOARD STATS
 * ========================================================================
 *
 * Backend:
 * GET /dashboard/stats
 *
 * Returns:
 * {
 *    headcount,
 *    onLeaveToday,
 *    newJoiners,
 *    avgAttendance
 * }
 * ========================================================================
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const response = await api.get<DashboardStats>("/dashboard/stats");
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 401) throw error;
        console.warn("Failed to fetch dashboard stats:", error);
        return { headcount: 0, onLeaveToday: 0, newJoiners: 0, avgAttendance: 0 };
    }
};

export const getLiveAttendance = async (): Promise<AttendanceChartData[]> => {
    try {
        const response = await api.get<AttendanceChartData[]>("/dashboard/live-attendance");
        return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
        if (error?.response?.status === 401) throw error;
        console.warn("Failed to fetch live attendance:", error);
        return [];
    }
};

export const getPendingApprovals = async (): Promise<PendingApproval[]> => {
    try {
        const response = await api.get<PendingApproval[]>("/dashboard/pending-approvals");
        return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
        if (error?.response?.status === 401) throw error;
        console.warn("Failed to fetch pending approvals:", error);
        return [];
    }
};

export const getEmployeeOverview = async (): Promise<EmployeeOverview[]> => {
    try {
        const response = await api.get<EmployeeOverview[]>("/dashboard/employee-overview");
        return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
        if (error?.response?.status === 401) throw error;
        console.warn("Failed to fetch employee overview:", error);
        return [];
    }
};

export const getPendingRegularizations = async (): Promise<PendingRegularization[]> => {
    try {
        const response = await api.get<PendingRegularization[]>("/attendance/regularize/pending");
        return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
        if (error?.response?.status === 401) throw error;
        console.warn("Failed to fetch pending regularizations:", error);
        return [];
    }
};

export const getAdminDashboardData = async () => {
    const [
        stats,
        attendanceData,
        pendingApprovals,
        employees,
        pendingRegularizations,
    ] = await Promise.all([
        getDashboardStats(),
        getLiveAttendance(),
        getPendingApprovals(),
        getEmployeeOverview(),
        getPendingRegularizations(),
    ]);

    return {
        stats,
        attendanceData,
        pendingApprovals,
        employees,
        pendingRegularizations,
    };
};