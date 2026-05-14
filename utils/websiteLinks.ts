
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

/**
 * Convert a property/unit name to a URL-safe slug.
 * e.g. "Baraka Heights" → "baraka-heights"
 */
export const slugify = (text: string): string =>
    (text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const websiteLinks = {
    base: WEBSITE_BASE,

    /**
     * Generate the canonical website listing URL for a property (or a unit within it).
     * Convention: https://task-me.ke/properties/<prop-slug>[?unit=<unit-slug>]
     * This is the source-of-truth for two-way sync — both the RMS and task-me.ke
     * derive the same URL from the property name, so no manual entry is needed.
     */
    listing: (propertyName: string, unitNumber?: string | null): string => {
        const propSlug = slugify(propertyName);
        const base = `${WEBSITE_BASE}/properties/${propSlug}`;
        if (unitNumber) {
            const unitSlug = unitNumber.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            return `${base}?unit=${encodeURIComponent(unitSlug)}`;
        }
        return base;
    },

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
