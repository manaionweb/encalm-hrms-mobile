export interface RegularizationUser {
    id: string;
    name: string;

    employeeProfile?: {
        title?: string;
    };
}

/**
 * Attendance Regularization Request
 */
export interface RegularizationRequest {
    id: string;

    userId: string;

    user?: RegularizationUser;

    date: string;

    proposedIn?: string | null;

    proposedOut?: string | null;

    reason: string;

    status: string;

    approverComment?: string | null;
}

/**
 * Reject Request Payload
 */
export interface RejectRegularizationPayload {
    reason: string;
    approverComment: string;
}

/**
 * Regularization State
 */
export interface RegularizationState {
    requests: RegularizationRequest[];
}