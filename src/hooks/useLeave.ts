import { useState, useEffect, useCallback } from "react";

import { useAuth } from "../context/AuthContext";

import {

    LeaveBalance,

    LeaveHistory,

    Holiday,

    ApplyLeavePayload,

} from "../types/leave";

import {

    getLeaveBalances,

    getLeaveHistory,

    getAllLeaveHistory,

    getHolidays,

    applyLeave,

    updateLeaveStatus,

} from "../services/leaveService";

interface UseLeaveReturn {

    loading: boolean;

    submitting: boolean;

    error: string | null;

    leaveBalances: LeaveBalance[];

    leaveHistory: LeaveHistory[];

    allLeaves: LeaveHistory[];

    holidays: Holiday[];

    refresh: () => Promise<void>;

    apply: (payload: ApplyLeavePayload) => Promise<void>;

    approve: (leaveId: number) => Promise<void>;

    reject: (

        leaveId: number,

        rejectionReason: string

    ) => Promise<void>;

}

export default function useLeave(): UseLeaveReturn {

    const { user } = useAuth();

    const isHrAdmin = user?.role === "HR_ADMIN";

    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [leaveBalances, setLeaveBalances] =

        useState<LeaveBalance[]>([]);

    const [leaveHistory, setLeaveHistory] =

        useState<LeaveHistory[]>([]);

    const [allLeaves, setAllLeaves] =

        useState<LeaveHistory[]>([]);

    const [holidays, setHolidays] =

        useState<Holiday[]>([]);

    /**
     * =====================================================
     * Fetch Data
     * =====================================================
     */

    const fetchLeaveData = useCallback(async () => {

        try {

            setError(null);

            const [

                balances,

                history,

                holidayList,

            ] = await Promise.all([

                getLeaveBalances(),

                getLeaveHistory(),

                getHolidays(),

            ]);

            setLeaveBalances(balances);

            setLeaveHistory(history);

            setHolidays(holidayList);

            if (isHrAdmin) {

                const adminLeaves =

                    await getAllLeaveHistory();

                setAllLeaves(adminLeaves);

            }

        } catch (err: any) {

            setError(

                err.message ||

                "Failed to load leave data."

            );

        } finally {

            setLoading(false);

        }

    }, [isHrAdmin]);

    useEffect(() => {

        fetchLeaveData();

    }, [fetchLeaveData]);

    /**
     * =====================================================
     * Refresh
     * =====================================================
     */

    const refresh = async () => {

        setLoading(true);

        await fetchLeaveData();

    };

    /**
     * =====================================================
     * Apply Leave
     * =====================================================
     */

    const apply = async (

        payload: ApplyLeavePayload

    ) => {

        setSubmitting(true);

        try {

            await applyLeave(payload);

            await fetchLeaveData();

        } finally {

            setSubmitting(false);

        }

    };

    /**
     * =====================================================
     * Approve Leave
     * =====================================================
     */

    const approve = async (

        leaveId: number

    ) => {

        await updateLeaveStatus(

            leaveId,

            {

                status: "APPROVED",

            }

        );

        await fetchLeaveData();

    };

    /**
     * =====================================================
     * Reject Leave
     * =====================================================
     */

    const reject = async (

        leaveId: number,

        rejectionReason: string

    ) => {

        await updateLeaveStatus(

            leaveId,

            {

                status: "REJECTED",

                rejectionReason,

            }

        );

        await fetchLeaveData();

    };

    return {

        loading,

        submitting,

        error,

        leaveBalances,

        leaveHistory,

        allLeaves,

        holidays,

        refresh,

        apply,

        approve,

        reject,

    };

}