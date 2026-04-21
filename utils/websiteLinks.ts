
/**
 * Central website URL utility.
 *
 * Set VITE_WEBSITE_URL in your .env to override the default:
 *   VITE_WEBSITE_URL=https://task-me.ke
 *
 * All share/referral link construction goes through here so there is
 * exactly one place to update when routes change.
 */
const WEBSITE_BASE = (
    ((import.meta as any).env?.VITE_WEBSITE_URL as string) ?? 'https://task-me.ke'
).replace(/\/$/, '');

export const websiteLinks = {
    base: WEBSITE_BASE,

    unit: (unitId: string, refCode?: string | null, propertyListingUrl?: string | null): string => {
        const ref = refCode ? `?ref=${encodeURIComponent(refCode)}` : '';
        if (propertyListingUrl) return `${propertyListingUrl.replace(/\/$/, '')}${ref}`;
        return `${WEBSITE_BASE}/book/${encodeURIComponent(unitId)}${ref}`;
    },

    invest: (refCode?: string | null): string => {
        const ref = refCode ? `?ref=${encodeURIComponent(refCode)}` : '';
        return `${WEBSITE_BASE}/invest${ref}`;
    },

    referral: (refCode: string): string =>
        `${WEBSITE_BASE}/ref/${encodeURIComponent(refCode)}`,

    landlord: (refCode?: string | null): string => {
        const ref = refCode ? `?ref=${encodeURIComponent(refCode)}` : '';
        return `${WEBSITE_BASE}/list${ref}`;
    },

    joinLandlord: (refCode?: string | null): string => {
        const ref = refCode ? `?ref=${encodeURIComponent(refCode)}` : '';
        return `${WEBSITE_BASE}/join/landlord${ref}`;
    },
};
