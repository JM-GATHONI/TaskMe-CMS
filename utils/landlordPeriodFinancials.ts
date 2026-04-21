import { Bill, CommissionRule, DeductionRule, Property, Task, TenantProfile } from '../types';

/** Paid tenant receipts in a calendar month (YYYY-MM). */
export function sumTenantPaymentsInPeriod(tenant: TenantProfile, period: string): number {
    return tenant.paymentHistory
        .filter(p => p.date.startsWith(period) && p.status === 'Paid')
        .reduce((s, p) => s + (parseFloat(String(p.amount).replace(/[^0-9.]/g, '')) || 0), 0);
}

/** Management commission and MRI should not apply to rent that was taken as placement fee (agency revenue). */
export function isAgencyFeeOnRentRule(ruleName: string): boolean {
    const n = ruleName.toLowerCase();
    return (
        n.includes('management') ||
        n.includes('mri') ||
        n.includes('rental income tax') ||
        n.includes('monthly rental income')
    );
}

export function computePlacementFeeDeduction(
    myTenants: TenantProfile[],
    properties: Property[],
    period: string
): { placementFeeDeduction: number; placementLines: Array<{ description: string; amount: number }> } {
    const newTenants = myTenants.filter(t => t.onboardingDate.startsWith(period));
    let placementFeeDeduction = 0;
    const placementLines: Array<{ description: string; amount: number }> = [];
    newTenants.forEach(t => {
        const prop = properties.find(p => p.id === t.propertyId);
        const isPlacementFeeActive = prop?.placementFee !== false;
        if (isPlacementFeeActive) {
            const amount = t.firstMonthRent || t.rentAmount || 0;
            placementFeeDeduction += amount;
            placementLines.push({ description: `Placement Fee: ${t.name}`, amount });
        }
    });
    return { placementFeeDeduction, placementLines };
}

export function filterActiveRulesForLandlord(
    deductionRules: DeductionRule[],
    landlordId: string,
    myProperties: Property[]
): DeductionRule[] {
    return deductionRules.filter(
        r =>
            r.status === 'Active' &&
            (r.applicability === 'Global' ||
                (r.applicability === 'Specific Landlord' && r.targetId === landlordId) ||
                (r.applicability === 'Specific Property' && myProperties.some(p => p.id === r.targetId)))
    );
}

/**
 * Payout-period view: percentages apply to **collected** rent; agency-style rules use
 * collected rent minus placement (rent used as placement fee is not subject to management/MRI).
 */
export function computeCollectedRuleDeductions(
    rules: DeductionRule[],
    myProperties: Property[],
    myTenants: TenantProfile[],
    period: string,
    collectedGross: number,
    placementFeeDeduction: number
): { total: number; lines: Array<{ description: string; amount: number }> } {
    const baseForAgency =
        placementFeeDeduction > 0 ? Math.max(0, collectedGross - placementFeeDeduction) : collectedGross;

    let total = 0;
    const lines: Array<{ description: string; amount: number }> = [];

    rules.forEach(r => {
        let amount = 0;
        if (r.type === 'Fixed') {
            amount = r.value;
        } else {
            if (r.applicability === 'Specific Property') {
                const prop = myProperties.find(p => p.id === r.targetId);
                if (prop) {
                    const propTenants = myTenants.filter(t => t.propertyId === prop.id);
                    const propCollected = propTenants.reduce(
                        (s, t) => s + sumTenantPaymentsInPeriod(t, period),
                        0
                    );
                    let base = propCollected;
                    if (isAgencyFeeOnRentRule(r.name) && placementFeeDeduction > 0) {
                        const placementOnProp = propTenants
                            .filter(t => t.onboardingDate.startsWith(period) && prop.placementFee !== false)
                            .reduce((s, t) => s + (t.firstMonthRent || t.rentAmount || 0), 0);
                        base = Math.max(0, propCollected - placementOnProp);
                    }
                    amount = base * (r.value / 100);
                }
            } else {
                const base = isAgencyFeeOnRentRule(r.name) ? baseForAgency : collectedGross;
                amount = base * (r.value / 100);
            }
        }
        total += amount;
        lines.push({ description: r.name, amount });
    });

    return { total, lines };
}

export function computeBillDeductionsForPeriod(
    bills: Bill[],
    myProperties: Property[],
    period: string
): { total: number; lines: Array<{ description: string; amount: number }> } {
    const periodBills = bills.filter(
        b => myProperties.some(p => p.id === b.propertyId) && b.invoiceDate.startsWith(period)
    );
    let total = 0;
    const lines: Array<{ description: string; amount: number }> = [];
    periodBills.forEach(b => {
        const amt = Number(b.amount) || 0;
        total += amt;
        lines.push({ description: `${b.category} - ${b.vendor}`, amount: amt });
    });
    return { total, lines };
}

export function computeMaintenanceFromTasksForPeriod(
    tasks: Task[],
    myProperties: Property[],
    period: string
): { total: number; lines: Array<{ description: string; amount: number }> } {
    const myTasks = tasks.filter(t => myProperties.some(p => p.name === t.property));
    const periodTasks = myTasks.filter(
        t => (t.status === 'Completed' || t.status === 'Closed') && t.dueDate.startsWith(period)
    );
    let total = 0;
    const lines: Array<{ description: string; amount: number }> = [];
    periodTasks.forEach(t => {
        const cost =
            (t.costs?.labor || 0) + (t.costs?.materials || 0) + (t.costs?.travel || 0);
        if (cost > 0) {
            total += cost;
            lines.push({ description: `Maint: ${t.title} (${t.property})`, amount: cost });
        }
    });
    return { total, lines };
}

// ── Partial Management ────────────────────────────────────────────────────────

/**
 * Generates the end-of-month invoice the agency sends to a Partial Management landlord.
 *
 * Financial flow for Partial Management:
 *   - Tenants pay rent directly to the landlord's own M-Pesa paybill.
 *   - The agency does NOT collect rent and therefore has nothing to remit.
 *   - Instead, at end of month the agency invoices the landlord for:
 *       1. Placement fee  — one month's rent for each new tenant placed in the period.
 *       2. Management fee — a percentage of the gross (expected) rent for the period,
 *                          derived from commissionRules (same rules as Full Management)
 *                          or defaulting to 10 % if no matching rule is configured.
 *       3. Bills          — any vendor/utility bills raised against the property.
 *       4. Maintenance    — cost of completed maintenance tasks in the period.
 *
 * Tenant payment history is still tracked per-tenant so arrears, overdue status,
 * and collection logs continue to work as normal.
 *
 * @param myTenants       All active tenants for this landlord's properties.
 * @param myProperties    All properties (Partial Management) belonging to this landlord.
 * @param bills           Global bills list (filtered internally to myProperties).
 * @param tasks           Global tasks list (filtered internally to myProperties).
 * @param commissionRules Agency commission rules (used to derive management fee %).
 * @param period          Calendar month in YYYY-MM format.
 */
export function computePartialManagementInvoice(
    myTenants: TenantProfile[],
    myProperties: Property[],
    bills: Bill[],
    tasks: Task[],
    commissionRules: CommissionRule[],
    period: string
): {
    invoiceLines: Array<{ description: string; amount: number; category: string }>;
    totalAmount: number;
    breakdown: {
        placementFee: number;
        managementFee: number;
        bills: number;
        maintenance: number;
    };
} {
    const invoiceLines: Array<{ description: string; amount: number; category: string }> = [];

    // ── 1. Placement Fee ────────────────────────────────────────────────────
    // For each new tenant onboarded in this period, charge the landlord one
    // month's rent as placement fee (same condition as Full Management, but
    // here it becomes a charge TO the landlord rather than a deduction from remittance).
    let placementTotal = 0;
    myTenants
        .filter(t => t.onboardingDate?.startsWith(period))
        .forEach(t => {
            const prop = myProperties.find(p => p.id === t.propertyId);
            if (prop?.placementFee !== false) {
                const amt = t.firstMonthRent || t.rentAmount || 0;
                placementTotal += amt;
                invoiceLines.push({
                    description: `Placement Fee – ${t.name} (${prop?.name ?? ''})`,
                    amount: amt,
                    category: 'Placement Fee',
                });
            }
        });

    // ── 2. Management Fee ───────────────────────────────────────────────────
    // Base = expected gross rent for the period (sum of all active tenant rents).
    // Rate = the 'Rent Collection' commission rule rate, defaulting to 10 %.
    const expectedGross = myTenants.reduce((s, t) => s + (t.rentAmount || 0), 0);
    const rentRule = commissionRules.find(r => r.trigger === 'Rent Collection');
    let managementFeeRate = 0.10; // default 10 %
    let managementFeeFixed = 0;
    if (rentRule) {
        if (rentRule.rateType === '%') managementFeeRate = rentRule.rateValue / 100;
        else { managementFeeFixed = rentRule.rateValue; managementFeeRate = 0; }
    }
    const managementFeeAmount = managementFeeFixed > 0
        ? managementFeeFixed
        : expectedGross * managementFeeRate;
    if (managementFeeAmount > 0) {
        invoiceLines.push({
            description: `Management Fee (${managementFeeFixed > 0 ? `KES ${managementFeeFixed}` : `${(managementFeeRate * 100).toFixed(1)}% of KES ${expectedGross.toLocaleString()}`})`,
            amount: managementFeeAmount,
            category: 'Management Fee',
        });
    }

    // ── 3. Bills ────────────────────────────────────────────────────────────
    const { total: billsTotal, lines: billLines } = computeBillDeductionsForPeriod(bills, myProperties, period);
    billLines.forEach(l => invoiceLines.push({ ...l, category: 'Bill' }));

    // ── 4. Maintenance ──────────────────────────────────────────────────────
    const { total: maintTotal, lines: maintLines } = computeMaintenanceFromTasksForPeriod(tasks, myProperties, period);
    maintLines.forEach(l => invoiceLines.push({ ...l, category: 'Maintenance' }));

    const totalAmount = placementTotal + managementFeeAmount + billsTotal + maintTotal;

    return {
        invoiceLines,
        totalAmount,
        breakdown: {
            placementFee: placementTotal,
            managementFee: managementFeeAmount,
            bills: billsTotal,
            maintenance: maintTotal,
        },
    };
}
