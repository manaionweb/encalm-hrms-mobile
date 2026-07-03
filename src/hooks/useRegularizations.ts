import { useState, useEffect, useCallback } from "react";

import {
    getPendingRegularizations,
    approveRegularization,
    rejectRegularization,
} from "../services/regularizationService";

import {
    RegularizationRequest,
} from "../types/regularization";

interface UseRegularizationsReturn {

    loading: boolean;

    refreshing: boolean;

    submitting: boolean;

    error: string | null;

    requests: RegularizationRequest[];

    refresh: () => Promise<void>;

    approve: (id: string) => Promise<void>;

    reject: (
        id: string,
        comment: string
    ) => Promise<void>;
}

export const useRegularizations =
    (): UseRegularizationsReturn => {

        /**
         * ==========================================================
         * States
         * ==========================================================
         */

        const [loading, setLoading] =
            useState(true);

        const [refreshing, setRefreshing] =
            useState(false);

        const [submitting, setSubmitting] =
            useState(false);

        const [error, setError] =
            useState<string | null>(null);

        const [requests, setRequests] =
            useState<RegularizationRequest[]>([]);

        /**
         * ==========================================================
         * Fetch Requests
         * ==========================================================
         */

        const fetchRequests =
            useCallback(async () => {

                try {

                    setError(null);

                    const data =
                        await getPendingRegularizations();

                    setRequests(data);

                } catch (err: any) {

                    console.error(err);

                    setError(
                        err.message ||
                        "Failed to load requests."
                    );

                } finally {

                    setLoading(false);

                    setRefreshing(false);

                }

            }, []);

        /**
         * ==========================================================
         * Initial Load
         * ==========================================================
         */

        useEffect(() => {

            fetchRequests();

        }, [fetchRequests]);

        /**
         * ==========================================================
         * Pull To Refresh
         * ==========================================================
         */

        const refresh = async () => {

            setRefreshing(true);

            await fetchRequests();

        };

        /**
         * ==========================================================
         * Approve Request
         * ==========================================================
         */

        const approve = async (
            id: string
        ) => {

            try {

                setSubmitting(true);

                await approveRegularization(id);

                setRequests(prev =>
                    prev.filter(r => r.id !== id)
                );

            } finally {

                setSubmitting(false);

            }

        };

        /**
         * ==========================================================
         * Reject Request
         * ==========================================================
         */

        const reject = async (
            id: string,
            comment: string
        ) => {

            try {

                setSubmitting(true);

                await rejectRegularization(
                    id,
                    {
                        reason: comment,
                        approverComment: comment,
                    }
                );

                setRequests(prev =>
                    prev.filter(r => r.id !== id)
                );

            } finally {

                setSubmitting(false);

            }

        };

        /**
         * ==========================================================
         * Return
         * ==========================================================
         */

        return {

            loading,

            refreshing,

            submitting,

            error,

            requests,

            refresh,

            approve,

            reject,

        };

    };

export default useRegularizations;