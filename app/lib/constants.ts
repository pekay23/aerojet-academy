export const FEE_STATUS = {
    UNPAID: 'UNPAID',
    VERIFYING: 'VERIFYING',   // Proof uploaded, awaiting admin review
    PAID: 'PAID',
    PARTIAL: 'PARTIAL',
    OVERDUE: 'OVERDUE',
    WAIVED: 'WAIVED',
} as const;

export const USER_ROLES = {
    ADMIN: 'ADMIN',
    STAFF: 'STAFF',
    INSTRUCTOR: 'INSTRUCTOR',
    STUDENT: 'STUDENT',
} as const;
