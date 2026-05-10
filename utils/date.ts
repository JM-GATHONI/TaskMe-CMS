/**
 * Centralised date-formatting helpers.
 * All display dates in the app use DD/MM/YY (en-GB, 2-digit year).
 */

/**
 * Format any date value as DD/MM/YY  (e.g. 09/05/26).
 * Returns '—' for null/undefined/invalid values.
 */
export function fmtDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
