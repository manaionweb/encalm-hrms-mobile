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
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * ========================================================================
 * GET LIVE ATTENDANCE
 * ========================================================================
 *
 * Backend:
 * GET /dashboard/live-attendance
 *
 * Returns:
 * [
 *   {
 *      name:"09:00",
 *      visitors:10
 *   }
 * ]
 * ========================================================================
 */
export const getLiveAttendance = async (): Promise<AttendanceChartData[]> => {
    try {
        const response =
            await api.get<AttendanceChartData[]>(
                "/dashboard/live-attendance"
            );

        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * ========================================================================
 * GET PENDING LEAVE APPROVALS
 * ========================================================================
 *
 * Backend:
 * GET /dashboard/pending-approvals
 *
 * Returns:
 * [
 *   {
 *      id,
 *      userName,
 *      type,
 *      duration,
 *      avatar
 *   }
 * ]
 * ========================================================================
 */
export const getPendingApprovals =
    async (): Promise<PendingApproval[]> => {
        try {
            const response =
                await api.get<PendingApproval[]>(
                    "/dashboard/pending-approvals"
                );

            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    };

/**
 * ========================================================================
 * GET EMPLOYEE OVERVIEW
 * ========================================================================
 *
 * Backend:
 * GET /dashboard/employee-overview
 *
 * Returns:
 * [
 *   {
 *      id,
 *      name,
 *      role,
 *      status
 *   }
 * ]
 * ========================================================================
 */
export const getEmployeeOverview =
    async (): Promise<EmployeeOverview[]> => {
        try {
            const response =
                await api.get<EmployeeOverview[]>(
                    "/dashboard/employee-overview"
                );

            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    };

/**
 * ========================================================================
 * GET PENDING ATTENDANCE REGULARIZATION
 * ========================================================================
 *
 * Backend:
 * GET /attendance/regularize/pending
 *
 * Returns:
 * [
 *   {
 *      id,
 *      employeeName,
 *      attendanceDate,
 *      reason,
 *      status
 *   }
 * ]
 *
 * If backend returns null/undefined
 * an empty array is returned.
 * ========================================================================
 */
export const getPendingRegularizations =
    async (): Promise<PendingRegularization[]> => {
        try {
            const response =
                await api.get<PendingRegularization[]>(
                    "/attendance/regularize/pending"
                );

            return Array.isArray(response.data)
                ? response.data
                : [];
        } catch (error) {
            throw handleApiError(error);
        }
    };

/**
 * ========================================================================
 * LOAD COMPLETE ADMIN DASHBOARD
 * ========================================================================
 *
 * This function loads every Dashboard API in parallel.
 *
 * Promise.all() is much faster than calling APIs one by one.
 *
 * Used by:
 *
 * useDashboard.ts
 *
 * ========================================================================
 */
export const getAdminDashboardData = async () => {
    try {
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
    } catch (error) {
        throw handleApiError(error);
    }
};