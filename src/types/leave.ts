export interface LeaveType {
    id?: number;
    code: string;
    name: string;
}

/**
 * Leave Balance
 */
export interface LeaveBalance {
    id?: number;

    name?: string;

    code?: string;

    total?: number;

    taken?: number;

    leaveType?: LeaveType;

    leaveTypeCode?: string;

    balance: number;
}

/**
 * Leave History
 */
export interface LeaveHistory {

    id: number;

    userId: number;

    startDate: string;

    endDate: string;

    status: string;

    reason: string;

    leaveType?: LeaveType;

    user?: {

        id: number;

        name: string;

    };

}

/**
 * Holiday
 */
export interface Holiday {

    id: number;

    name: string;

    date: string;

}

/**
 * Apply Leave Payload
 */
export interface ApplyLeavePayload {

    leaveTypeCode: string;

    startDate: string;

    endDate: string;

    reason: string;

}

/**
 * Update Leave Status Payload
 */
export interface UpdateLeaveStatusPayload {

    status: "APPROVED" | "REJECTED";

    rejectionReason?: string;

}