/**
 * ============================================================
 * Dashboard Types
 * ============================================================
 * This file contains all interfaces used in the Dashboard.
 * Every component, hook, and service will import these types.
 * ============================================================
 */

/**
 * Dashboard Statistics
 * Returned by:
 * GET /dashboard/stats
 */
export interface DashboardStats {
    headcount: number;
    onLeaveToday: number;
    newJoiners: number;
    avgAttendance: number;
}

/**
 * Live Attendance Graph
 * Returned by:
 * GET /dashboard/live-attendance
 */
export interface AttendanceChartData {
    name: string;
    visitors: number;
}

/**
 * Pending Leave Approval
 * Returned by:
 * GET /dashboard/pending-approvals
 */
export interface PendingApproval {
    id: string;

    userName: string;

    type: string;

    duration: number;

    avatar: string | null;
}

/**
 * Employee Overview
 * Returned by:
 * GET /dashboard/employee-overview
 */
export interface EmployeeOverview {
    id: string;

    name: string;

    role: string;

    status: string;
}

/**
 * Pending Attendance Regularization
 * Returned by:
 * GET /attendance/regularize/pending
 */
export interface PendingRegularization {

    id: string;

    employeeName: string;

    attendanceDate: string;

    reason: string;

    status: string;

}

/**
 * Complete Dashboard State
 */
export interface DashboardState {

    stats: DashboardStats;

    attendanceData: AttendanceChartData[];

    pendingApprovals: PendingApproval[];

    pendingRegularizations: PendingRegularization[];

    employees: EmployeeOverview[];

}