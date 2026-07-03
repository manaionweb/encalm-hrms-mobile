import api from "../utils/api";

import {
    RegularizationRequest,
    RejectRegularizationPayload,
} from "../types/regularization";

/**
 * ============================================================================
 * Generic API Error Handler
 * ============================================================================
 */

const handleApiError = (error: any): Error => {

    console.error("Regularization API Error:", error);

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
 * GET PENDING REGULARIZATIONS
 * ============================================================================
 *
 * GET /attendance/regularize/pending
 *
 * ============================================================================
 */

export const getPendingRegularizations =
    async (): Promise<RegularizationRequest[]> => {

        try {

            const response =
                await api.get<RegularizationRequest[]>(
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
 * ============================================================================
 * APPROVE REGULARIZATION
 * ============================================================================
 *
 * PUT /attendance/regularize/:id/approve
 *
 * ============================================================================
 */

export const approveRegularization =
    async (id: string): Promise<void> => {

        try {

            await api.put(
                `/attendance/regularize/${id}/approve`
            );

        } catch (error) {

            throw handleApiError(error);

        }

    };

/**
 * ============================================================================
 * REJECT REGULARIZATION
 * ============================================================================
 *
 * PUT /attendance/regularize/:id/reject
 *
 * ============================================================================
 */

export const rejectRegularization =
    async (
        id: string,
        payload: RejectRegularizationPayload
    ): Promise<void> => {

        try {

            await api.put(
                `/attendance/regularize/${id}/reject`,
                payload
            );

        } catch (error) {

            throw handleApiError(error);

        }

    };