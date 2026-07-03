import api from "../utils/api";

import {
    ApplyLeavePayload,
    LeaveBalance,
    LeaveHistory,
    Holiday,
    UpdateLeaveStatusPayload,
} from "../types/leave";

/**
 * ============================================================================
 * Generic API Error Handler
 * ============================================================================
 */

const handleApiError = (error: any): Error => {

    console.error("Leave API Error:", error);

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
 * ============================================================================
 * GET LEAVE BALANCES
 * ============================================================================
 */

export const getLeaveBalances =
    async (): Promise<LeaveBalance[]> => {

        try {

            const response =
                await api.get<LeaveBalance[]>(
                    "/leave/balances"
                );

            return Array.isArray(response.data)
                ? response.data
                : [];

        } catch (error) {

            throw handleApiError(error);

        }

    };

/**
 * ============================================================================
 * GET MY LEAVE HISTORY
 * ============================================================================
 */

export const getLeaveHistory =
    async (): Promise<LeaveHistory[]> => {

        try {

            const response =
                await api.get<LeaveHistory[]>(
                    "/leave/history"
                );

            return Array.isArray(response.data)
                ? response.data
                : [];

        } catch (error) {

            throw handleApiError(error);

        }

    };

/**
 * ============================================================================
 * GET ALL LEAVE HISTORY (HR ADMIN)
 * ============================================================================
 */

export const getAllLeaveHistory =
    async (): Promise<LeaveHistory[]> => {

        try {

            const response =
                await api.get<LeaveHistory[]>(
                    "/leave/history?all=true"
                );

            return Array.isArray(response.data)
                ? response.data
                : [];

        } catch (error) {

            throw handleApiError(error);

        }

    };

/**
 * ============================================================================
 * GET HOLIDAYS
 * ============================================================================
 */

export const getHolidays =
    async (): Promise<Holiday[]> => {

        try {

            const response =
                await api.get<Holiday[]>(
                    "/masters/holidays"
                );

            return Array.isArray(response.data)
                ? response.data
                : [];

        } catch (error) {

            throw handleApiError(error);

        }

    };

/**
 * ============================================================================
 * APPLY LEAVE
 * ============================================================================
 */

export const applyLeave =
    async (
        payload: ApplyLeavePayload
    ): Promise<void> => {

        try {

            await api.post(
                "/leave/apply",
                payload
            );

        } catch (error) {

            throw handleApiError(error);

        }

    };

/**
 * ============================================================================
 * UPDATE LEAVE STATUS
 * ============================================================================
 */

export const updateLeaveStatus =
    async (
        leaveId: number,
        payload: UpdateLeaveStatusPayload
    ): Promise<void> => {

        try {

            await api.put(
                `/leave/${leaveId}/status`,
                payload
            );

        } catch (error) {

            throw handleApiError(error);

        }

    };