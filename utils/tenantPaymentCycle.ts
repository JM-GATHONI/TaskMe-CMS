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

export interface RentPaymentCycleResult {
    nextDueDateIso: string;
    monthsCovered: number;
    /**
     * When true the rent extension period has ended (tenant paid their first
     * deferred rent). Callers should restore originalGraceDays and clear the
     * rentExtension object on the TenantProfile.
     */
    clearRentExtension?: boolean;
    /**
     * Present when the tenant has a proratedDeposit and made a payment that
     * advances the installment counter. Callers should merge these values into
     * the tenant's proratedDeposit object and update depositPaid accordingly.
     */
    proratedUpdate?: {
        monthsPaid: number;
        amountPaidSoFar: number;
        /** True once amountPaidSoFar >= totalDepositAmount. */
        fullyPaid: boolean;
    };
}

export function computeRentPaymentCycleUpdate(
    tenant: TenantProfile,
    amountPaid: number,
    paymentDateIso: string,
): RentPaymentCycleResult {
    const dueDay = clampDueDay(tenant.rentDueDate);
    const monthlyRent = Math.max(0, Number(tenant.rentAmount || 0));
    const paid = Math.max(0, Number(amountPaid || 0));

    const paymentDate = new Date(paymentDateIso || new Date().toISOString().split('T')[0]);
    paymentDate.setHours(0, 0, 0, 0);

    // ── Rent Extension: first deferred rent ───────────────────────────────────
    // The next due date was set to the deferred date at activation; after the
    // tenant pays, switch back to standard 1st-of-month cycle.
    if (tenant.rentExtension?.enabled) {
        if (paid >= monthlyRent) {
            // Payment covers at least one month's rent → extension satisfied.
            const monthsCovered = monthlyRent > 0 ? Math.max(1, Math.floor(paid / monthlyRent)) : 1;
            const nextDue = addMonthsKeepingDay(paymentDate, monthsCovered, dueDay);
            return {
                nextDueDateIso: toIsoDate(nextDue),
                monthsCovered,
                clearRentExtension: true,
            };
        }
        // Payment is less than one month — do not advance cycle.
        return {
            nextDueDateIso: tenant.nextDueDate ?? paymentDateIso,
            monthsCovered: 0,
        };
    }

    // ── Prorated Deposit: installment alongside rent ───────────────────────────
    if (tenant.proratedDeposit?.enabled) {
        const pd = tenant.proratedDeposit;
        const installment = pd.monthlyInstallment || 0;
        const amountForRent = Math.max(0, paid - installment);
        const monthsCovered = monthlyRent > 0 ? Math.max(1, Math.floor(amountForRent / monthlyRent)) : 1;
        const nextDue = addMonthsKeepingDay(paymentDate, monthsCovered, dueDay);

        // Update deposit tracking
        const newAmountPaid = Math.min(pd.totalDepositAmount, pd.amountPaidSoFar + Math.min(installment, paid));
        const newMonthsPaid = pd.monthsPaid + 1;
        const fullyPaid = newAmountPaid >= pd.totalDepositAmount;

        return {
            nextDueDateIso: toIsoDate(nextDue),
            monthsCovered,
            proratedUpdate: {
                monthsPaid: newMonthsPaid,
                amountPaidSoFar: newAmountPaid,
                fullyPaid,
            },
        };
    }

    // ── Standard / Multi-month deposit / Deposit Exempt ───────────────────────
    // Deposit is already paid (or not required) — entire amount applies to rent.
    const depositOutstanding = Number(tenant.depositPaid || 0) > 0 ? 0 : monthlyRent;
    const amountForRent = Math.max(0, paid - depositOutstanding);
    const monthsCovered = monthlyRent > 0 ? Math.max(0, Math.floor(amountForRent / monthlyRent)) : 0;
    const monthsToAdvance = Math.max(1, monthsCovered || 1);
    const nextDue = addMonthsKeepingDay(paymentDate, monthsToAdvance, dueDay);

    return {
        nextDueDateIso: toIsoDate(nextDue),
        monthsCovered: monthsToAdvance,
    };
}
