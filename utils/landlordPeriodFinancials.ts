import { DeductionRule, Property, Task, TenantProfile } from '../types';

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
            const amount = t.rentAmount || 0;
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
                            .reduce((s, t) => s + (t.rentAmount || 0), 0);
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
