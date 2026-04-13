import type { SupabaseClient } from '@supabase/supabase-js';

export type PaymentRow = {
    status?: string | null;
    checkout_request_id?: string | null;
    transaction_id?: string | null;
    result_desc?: string | null;
};

/**
 * Subscribe to realtime updates for a payment row; also poll periodically so UX
 * works if Realtime is unavailable.
 *
 * When the payment completes/fails/cancels, `onUpdate` is called with the DB row.
 * When polling exhausts `maxPolls` without a terminal status, `onUpdate` is called
 * once with `{ status: 'timed_out' }` so the UI can show a graceful timeout state.
 */
export function followStkPaymentCompletion(
    supabase: SupabaseClient,
    userId: string,
    checkoutRequestId: string,
    onUpdate: (row: PaymentRow) => void,
    options?: { pollMs?: number; maxPolls?: number },
): () => void {
    const pollMs = options?.pollMs ?? 3500;
    const maxPolls = options?.maxPolls ?? 34; // ~2 minutes (34 × 3.5 s)

    let stopped = false;
    let pollCount = 0;
    // Track whether we've already received a terminal status so we don't double-fire.
    let settled = false;

    const TERMINAL = new Set(['completed', 'failed', 'cancelled']);

    const settle = (row: PaymentRow) => {
        if (settled) return;
        settled = true;
        stopped = true;
        supabase.removeChannel(channel);
        onUpdate(row);
    };

    const channel = supabase
        .channel(`stk-follow-${userId}-${checkoutRequestId}-${Date.now()}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` },
            (payload: any) => {
                const row = (payload?.new ?? payload?.old) as PaymentRow | undefined;
                if (!row || String(row.checkout_request_id ?? '') !== checkoutRequestId) return;
                if (TERMINAL.has(String(row.status ?? ''))) settle(row);
                else onUpdate(row); // pass through non-terminal updates (e.g. pending)
            },
        )
        .subscribe();

    const poll = async () => {
        if (stopped) return;
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('status,checkout_request_id,transaction_id,result_desc')
                .eq('user_id', userId)
                .eq('checkout_request_id', checkoutRequestId)
                .maybeSingle();
            if (!error && data) {
                const row = data as PaymentRow;
                if (TERMINAL.has(String(row.status ?? ''))) {
                    settle(row);
                    return; // stop polling
                }
                onUpdate(row);
            }
        } catch {
            /* network hiccup — continue polling */
        }

        pollCount += 1;
        if (stopped) return;

        if (pollCount >= maxPolls) {
            // Polling exhausted — emit timeout so UI can react gracefully.
            if (!settled) {
                settled = true;
                stopped = true;
                supabase.removeChannel(channel);
                onUpdate({ status: 'timed_out', checkout_request_id: checkoutRequestId });
            }
            return;
        }

        setTimeout(poll, pollMs);
    };

    setTimeout(poll, pollMs);

    return () => {
        stopped = true;
        settled = true;
        supabase.removeChannel(channel);
    };
}
