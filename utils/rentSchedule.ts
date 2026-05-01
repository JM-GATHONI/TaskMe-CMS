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
 * Calendar-month view: compares today's day-of-month to due + grace.
 * Fine accrues for each full day after (dueDay + graceDays) when current month rent not marked paid.
 */
export function getMonthlyRentStatus(
    tenant: TenantProfile,
    opts?: { lateFeePerDay?: number; isRentPaidThisMonth?: boolean },
): MonthlyRentStatus {
    const lateFeePerDay = opts?.lateFeePerDay ?? DEFAULT_LATE_PER_DAY;
    const today = new Date();
    const dom = today.getDate();

    // Requirement alignment:
    // - Last due date is effectively the last rent payment date (activation uses first payment).
    // - Next due date is always the 1st of the next month after last due date.
    // - Late fees only accrue after (nextDueDate + graceDays).
    const paidDates = (tenant.paymentHistory || [])
        .filter(p => p.status === 'Paid' && !!p.date)
        .map(p => String(p.date));

    const latestPaidDateStr =
        paidDates.length > 0 ? paidDates.reduce((max, d) => (d > max ? d : max), paidDates[0]) : null;

    // Prefer the latest rent payment date for "last due date", but fall back to onboardingDate if paymentHistory is empty.
    const onboardingDateStr = tenant.onboardingDate ? String(tenant.onboardingDate) : null;
    const chosenLastDueStr =
        latestPaidDateStr && onboardingDateStr
            ? onboardingDateStr > latestPaidDateStr
                ? onboardingDateStr
                : latestPaidDateStr
            : (latestPaidDateStr ?? onboardingDateStr ?? null);

    const lastDueDate = chosenLastDueStr ? new Date(chosenLastDueStr) : today;
    lastDueDate.setHours(0, 0, 0, 0);

    const nextDueDate = new Date(lastDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    nextDueDate.setDate(1);
    nextDueDate.setHours(0, 0, 0, 0);

    const nextPeriodPrefix = nextDueDate.toISOString().slice(0, 7);
    const todayPrefix = today.toISOString().slice(0, 7);

    const grace = getRentGraceDays(tenant);
    const dueDay = getRentDueDay(tenant);
    const lateStartsOnDay = dueDay + grace; // late starts on (1 + graceDays) day-of-month

    let paidForNextDuePeriod = opts?.isRentPaidThisMonth;
    if (paidForNextDuePeriod === undefined) {
        paidForNextDuePeriod = (tenant.paymentHistory || []).some(
            p => p.date.startsWith(nextPeriodPrefix) && p.status === 'Paid',
        );
    } else {
        // Only trust the caller's "isRentPaidThisMonth" when it refers to the same period we are calculating.
        if (todayPrefix !== nextPeriodPrefix) paidForNextDuePeriod = false;
    }

    const allocated =
        !!tenant.propertyId &&
        !!tenant.unitId &&
        !!String(tenant.unit ?? '').trim() &&
        !!String(tenant.propertyName ?? '').trim();

    // Late fees only accrue once a tenant is in the Active lifecycle and the
    // first move-in month has passed. Pending* / Vacated / Notice tenants are
    // not in the rent cycle yet, and the activation month itself is fee-free
    // — fines start the 6th of the FIRST FULL month after activation.
    const isInLateFeeWindow = tenant.status === 'Active' || tenant.status === 'Overdue';
    // Fall back to onboardingDate when activationDate was never written (legacy
    // records or tenants onboarded before the field was added), so the first
    // month is always treated as fee-free regardless of when the field was set.
    const activationStr = (tenant as any).activationDate
        ? String((tenant as any).activationDate)
        : (tenant.onboardingDate ? String(tenant.onboardingDate) : null);
    const activationMonthPrefix = activationStr ? activationStr.slice(0, 7) : null;
    const inActivationMonth = !!(activationMonthPrefix && activationMonthPrefix === todayPrefix);

    if (!allocated || paidForNextDuePeriod || tenant.status === 'Vacated' || !isInLateFeeWindow || inActivationMonth) {
        return {
            dueDay,
            graceDays: grace,
            lateStartsOnDay,
            daysLateThisMonth: 0,
            automatedLateFine: 0,
        };
    }

    // Only accrue late fees during the month of the *next due date*.
    if (todayPrefix !== nextPeriodPrefix) {
        return {
            dueDay,
            graceDays: grace,
            lateStartsOnDay,
            daysLateThisMonth: 0,
            automatedLateFine: 0,
        };
    }

    if (dom <= lateStartsOnDay) {
        return {
            dueDay,
            graceDays: grace,
            lateStartsOnDay,
            daysLateThisMonth: 0,
            automatedLateFine: 0,
        };
    }

    const daysLate = dom - lateStartsOnDay;
    return {
        dueDay,
        graceDays: grace,
        lateStartsOnDay,
        daysLateThisMonth: daysLate,
        automatedLateFine: daysLate * lateFeePerDay,
    };
}
