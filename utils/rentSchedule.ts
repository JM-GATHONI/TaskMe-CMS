import type { TenantProfile } from '../types';

/** Day of month rent is due (1–28). Default 1. */
export function getRentDueDay(tenant: Pick<TenantProfile, 'rentDueDate'>): number {
    const d = tenant.rentDueDate;
    if (d == null || !Number.isFinite(d)) return 1;
    return Math.min(28, Math.max(1, Math.round(d)));
}

/** Grace days after due day before late rent accrues. Default 5 (due 1st → fines from 6th). */
export function getRentGraceDays(tenant: Pick<TenantProfile, 'rentGraceDays'>): number {
    const g = tenant.rentGraceDays;
    if (g == null || !Number.isFinite(g)) return 5;
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
    const dueDay = getRentDueDay(tenant);
    const grace = getRentGraceDays(tenant);
    const lateStartsOnDay = dueDay + grace;
    const today = new Date();
    const dom = today.getDate();

    let paid = opts?.isRentPaidThisMonth;
    if (paid === undefined) {
        const prefix = today.toISOString().slice(0, 7);
        paid = (tenant.paymentHistory || []).some(p => p.date.startsWith(prefix) && p.status === 'Paid');
    }

    const allocated =
        !!tenant.propertyId &&
        !!tenant.unitId &&
        !!String(tenant.unit ?? '').trim() &&
        !!String(tenant.propertyName ?? '').trim();

    if (!allocated || paid || tenant.status === 'Vacated') {
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
