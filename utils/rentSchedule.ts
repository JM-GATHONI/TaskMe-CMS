import type { TenantProfile } from '../types';

/** Day of month rent is due (1–28). Default 1. */
export function getRentDueDay(tenant: Pick<TenantProfile, 'rentDueDate'>): number {
    const d = tenant.rentDueDate;
    if (d == null || !Number.isFinite(d)) return 1;
    return Math.min(28, Math.max(1, Math.round(d)));
}

/** Grace days after due day before late rent accrues. Default 4 (due 1st → fines from 5th). */
export function getRentGraceDays(tenant: Pick<TenantProfile, 'rentGraceDays'>): number {
    const g = tenant.rentGraceDays;
    if (g == null || !Number.isFinite(g)) return 4;
    return Math.min(28, Math.max(0, Math.round(g)));
}

/** First calendar day of month (1–31) when late rent / automated fine logic may apply (day after grace ends). */
export function getLateFineStartDay(tenant: Pick<TenantProfile, 'rentDueDate' | 'rentGraceDays'>): number {
    return getRentDueDay(tenant) + getRentGraceDays(tenant);
}

export interface MonthlyRentStatus {
    dueDay: number;
    graceDays: number;
    lateStartsOnDay: number;
    /** Days past late start in current month (0 if not yet in late window). */
    daysLateThisMonth: number;
    /** Rough automated late rent accrual for UI (KES per day late after grace). */
    automatedLateFine: number;
}

const DEFAULT_LATE_PER_DAY = 100;

/**
 * Current-month view: accrues a late fee for every day past (dueDay + graceDays)
 * in the current calendar month when rent has not been fully paid.
 *
 * Example: due=1st, grace=4 days → lateStartsOnDay=5 → fee from 6th onward.
 * On the 8th with no payment: daysLate = 8 - 5 = 3, fee = 3 × lateFeePerDay.
 *
 * Applies to Active/Overdue tenants only. Not charged in the activation month.
 * Only triggered when rent itself is unpaid — outstanding bills do not qualify.
 */
export function getMonthlyRentStatus(
    tenant: TenantProfile,
    opts?: { lateFeePerDay?: number; isRentPaidThisMonth?: boolean },
): MonthlyRentStatus {
    const lateFeePerDay = opts?.lateFeePerDay ?? DEFAULT_LATE_PER_DAY;
    const today = new Date();
    const dom = today.getDate();
    const todayPrefix = today.toISOString().slice(0, 7);

    const grace = getRentGraceDays(tenant);
    const dueDay = getRentDueDay(tenant);
    const lateStartsOnDay = dueDay + grace;

    const allocated =
        !!tenant.propertyId &&
        !!tenant.unitId &&
        !!String(tenant.unit ?? '').trim() &&
        !!String(tenant.propertyName ?? '').trim();

    // Only Active or Overdue tenants accrue late fees
    const isInLateFeeWindow = tenant.status === 'Active' || tenant.status === 'Overdue';

    // Activation month is always fee-free (fines start the first full month after move-in)
    const activationStr = (tenant as any).activationDate
        ? String((tenant as any).activationDate)
        : (tenant.onboardingDate ? String(tenant.onboardingDate) : null);
    const activationMonthPrefix = activationStr ? activationStr.slice(0, 7) : null;
    const inActivationMonth = !!(activationMonthPrefix && activationMonthPrefix === todayPrefix);

    // Determine whether this month's rent has been paid in full.
    // Trust the caller's value when provided; otherwise compute from payment history.
    let isRentPaidThisMonth = opts?.isRentPaidThisMonth;
    if (isRentPaidThisMonth === undefined) {
        const totalPaidThisMonth = (tenant.paymentHistory || [])
            .filter(p => p.status === 'Paid' && p.date.startsWith(todayPrefix))
            .reduce((sum, p) => sum + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);
        isRentPaidThisMonth = totalPaidThisMonth >= (tenant.rentAmount || 0);
    }

    if (!allocated || isRentPaidThisMonth || tenant.status === 'Vacated' || !isInLateFeeWindow || inActivationMonth) {
        return { dueDay, graceDays: grace, lateStartsOnDay, daysLateThisMonth: 0, automatedLateFine: 0 };
    }

    // Still within grace period — no fee yet
    if (dom <= lateStartsOnDay) {
        return { dueDay, graceDays: grace, lateStartsOnDay, daysLateThisMonth: 0, automatedLateFine: 0 };
    }

    // Backdate: every day since grace ended in the current month accrues a fee
    const daysLate = dom - lateStartsOnDay;
    return {
        dueDay,
        graceDays: grace,
        lateStartsOnDay,
        daysLateThisMonth: daysLate,
        automatedLateFine: daysLate * lateFeePerDay,
    };
}
