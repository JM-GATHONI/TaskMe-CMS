import type { TenantProfile } from '../types';

function clampDueDay(day: number | undefined): number {
    const d = Number(day ?? 1);
    if (!Number.isFinite(d)) return 1;
    return Math.min(28, Math.max(1, Math.round(d)));
}

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function addMonthsKeepingDay(base: Date, months: number, dueDay: number): Date {
    const out = new Date(base);
    out.setMonth(out.getMonth() + months);
    out.setDate(dueDay);
    out.setHours(0, 0, 0, 0);
    return out;
}

export function computeRentPaymentCycleUpdate(
    tenant: TenantProfile,
    amountPaid: number,
    paymentDateIso: string,
): { nextDueDateIso: string; monthsCovered: number } {
    const dueDay = clampDueDay(tenant.rentDueDate);
    const monthlyRent = Math.max(0, Number(tenant.rentAmount || 0));
    const depositOutstanding = Number(tenant.depositPaid || 0) > 0 ? 0 : monthlyRent;

    const paid = Math.max(0, Number(amountPaid || 0));
    const amountForRent = Math.max(0, paid - depositOutstanding);
    const monthsCovered = monthlyRent > 0 ? Math.max(0, Math.floor(amountForRent / monthlyRent)) : 0;
    const monthsToAdvance = Math.max(1, monthsCovered || 1);

    const paymentDate = new Date(paymentDateIso || new Date().toISOString().split('T')[0]);
    paymentDate.setHours(0, 0, 0, 0);
    const nextDue = addMonthsKeepingDay(paymentDate, monthsToAdvance, dueDay);

    return {
        nextDueDateIso: toIsoDate(nextDue),
        monthsCovered: monthsToAdvance,
    };
}

