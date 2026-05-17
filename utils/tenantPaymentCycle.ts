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

function getEffectiveRentForDate(tenant: TenantProfile, paymentDateIso: string): number {
    const activationMonthIso = (tenant as any).activationDate
        ? String((tenant as any).activationDate).slice(0, 7)
        : (tenant.onboardingDate ? String(tenant.onboardingDate).slice(0, 7) : null);
    const paymentMonthIso = String(paymentDateIso || '').slice(0, 7);
    const firstMonthRent = Number((tenant as any).firstMonthRent || 0);
    if (activationMonthIso === paymentMonthIso && firstMonthRent > 0) return Math.max(0, firstMonthRent);
    return Math.max(0, Number(tenant.rentAmount || 0));
}

function getDepositExpected(tenant: TenantProfile): number {
    const depMonths = Number.isFinite(Number((tenant as any).depositMonths)) && Number((tenant as any).depositMonths) > 0
        ? Number((tenant as any).depositMonths)
        : 1;
    return Number((tenant as any).depositExpected ?? 0) > 0
        ? Number((tenant as any).depositExpected)
        : Math.max(0, Number(tenant.rentAmount || 0) * depMonths);
}

export interface PendingTenantPaymentAllocation {
    effectiveRent: number;
    depositExpected: number;
    depositOutstanding: number;
    depositCreditApplied: number;
    depositPaidAfterPayment: number;
    rentAmountAvailable: number;
    depositAlreadySettled: boolean;
    depositSettledAfterPayment: boolean;
    rentCoveredByPayment: boolean;
}

export function getPendingTenantPaymentAllocation(
    tenant: TenantProfile,
    amountPaid: number,
    paymentDateIso: string,
): PendingTenantPaymentAllocation {
    const paid = Math.max(0, Number(amountPaid || 0));
    const effectiveRent = getEffectiveRentForDate(tenant, paymentDateIso);
    const depositExpected = getDepositExpected(tenant);
    const currentDepositPaid = Math.max(0, Number(tenant.depositPaid || 0));
    const isStandardDepositRequired = !tenant.depositExempt && !tenant.proratedDeposit?.enabled && !tenant.rentExtension?.enabled && depositExpected > 0;
    const depositOutstanding = isStandardDepositRequired
        ? Math.max(0, depositExpected - currentDepositPaid)
        : 0;
    const depositCreditApplied = Math.min(paid, depositOutstanding);
    const depositPaidAfterPayment = isStandardDepositRequired
        ? Math.min(depositExpected, currentDepositPaid + depositCreditApplied)
        : currentDepositPaid;
    const depositAlreadySettled = tenant.depositExempt
        || !!tenant.rentExtension?.enabled
        || (tenant.proratedDeposit?.enabled
            ? tenant.proratedDeposit.amountPaidSoFar + 0.5 >= tenant.proratedDeposit.totalDepositAmount
            : depositExpected > 0 && currentDepositPaid + 0.5 >= depositExpected);
    const depositSettledAfterPayment = depositAlreadySettled || (tenant.proratedDeposit?.enabled
        ? paid >= effectiveRent + (tenant.proratedDeposit.monthlyInstallment || 0)
        : (tenant.depositExempt || depositExpected <= 0 || depositPaidAfterPayment + 0.5 >= depositExpected));
    const rentAmountAvailable = tenant.proratedDeposit?.enabled
        ? Math.max(0, paid - (tenant.proratedDeposit.monthlyInstallment || 0))
        : Math.max(0, paid - depositCreditApplied);
    const rentCoveredByPayment = rentAmountAvailable + 0.5 >= effectiveRent;
    return {
        effectiveRent,
        depositExpected,
        depositOutstanding,
        depositCreditApplied,
        depositPaidAfterPayment,
        rentAmountAvailable,
        depositAlreadySettled,
        depositSettledAfterPayment,
        rentCoveredByPayment,
    };
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
    const monthlyRent = getEffectiveRentForDate(tenant, paymentDateIso);
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
        const monthsCovered = monthlyRent > 0 ? Math.max(0, Math.floor(amountForRent / monthlyRent)) : 0;
        const nextDue = monthsCovered > 0 ? addMonthsKeepingDay(paymentDate, monthsCovered, dueDay) : null;

        // Update deposit tracking
        const newAmountPaid = Math.min(pd.totalDepositAmount, pd.amountPaidSoFar + Math.min(installment, paid));
        const newMonthsPaid = pd.monthsPaid + (Math.min(installment, paid) + 0.5 >= installment ? 1 : 0);
        const fullyPaid = newAmountPaid >= pd.totalDepositAmount;

        return {
            nextDueDateIso: nextDue ? toIsoDate(nextDue) : (tenant.nextDueDate ?? paymentDateIso),
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
    const depositOutstanding = tenant.depositExempt ? 0 : Math.max(0, getDepositExpected(tenant) - Math.max(0, Number(tenant.depositPaid || 0)));
    const amountForRent = Math.max(0, paid - depositOutstanding);
    const monthsCovered = monthlyRent > 0 ? Math.max(0, Math.floor(amountForRent / monthlyRent)) : 0;
    const nextDue = monthsCovered > 0 ? addMonthsKeepingDay(paymentDate, monthsCovered, dueDay) : null;

    return {
        nextDueDateIso: nextDue ? toIsoDate(nextDue) : (tenant.nextDueDate ?? paymentDateIso),
        monthsCovered,
    };
}
