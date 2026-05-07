
/**
 * Central website URL utility.
 *
 * Set VITE_WEBSITE_URL in your .env to override the default:
 *   VITE_WEBSITE_URL=https://task-me.ke
 *
 * All share/referral link construction goes through here so there is
 * exactly one place to update when routes change.
 *
 * Links resolve to the app's own ReferralLanding page
 * (/#/user-app-portal/referral-landing) so they are always functional
 * regardless of whether an external website is live.
 */
const WEBSITE_BASE = (
    ((import.meta as any).env?.VITE_WEBSITE_URL as string) ?? 'https://task-me.ke'
).replace(/\/$/, '');

const LANDING = `${WEBSITE_BASE}/#/user-app-portal/referral-landing`;

export const websiteLinks = {
    base: WEBSITE_BASE,

    unit: (unitId: string, refCode?: string | null, propertyListingUrl?: string | null): string => {
        if (propertyListingUrl) {
            const sep = propertyListingUrl.includes('?') ? '&' : '?';
            const ref = refCode ? `${sep}ref=${encodeURIComponent(refCode)}` : '';
            return `${propertyListingUrl.replace(/\/$/, '')}${ref}`;
        }
        const params = new URLSearchParams({ type: 'unit', id: unitId });
        if (refCode) params.set('ref', refCode);
        return `${LANDING}?${params.toString()}`;
    },

    invest: (refCode?: string | null): string => {
        const params = new URLSearchParams({ type: 'invest' });
        if (refCode) params.set('ref', refCode);
        return `${LANDING}?${params.toString()}`;
    },

    referral: (refCode: string): string =>
        `${LANDING}?ref=${encodeURIComponent(refCode)}`,

    landlord: (refCode?: string | null): string => {
        const params = new URLSearchParams({ type: 'landlord' });
        if (refCode) params.set('ref', refCode);
        return `${LANDING}?${params.toString()}`;
    },

    joinLandlord: (refCode?: string | null): string => {
        const params = new URLSearchParams({ type: 'landlord' });
        if (refCode) params.set('ref', refCode);
        return `${LANDING}?${params.toString()}`;
    },
};
