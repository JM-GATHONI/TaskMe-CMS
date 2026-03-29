import type { SupabaseClient } from '@supabase/supabase-js';

export type PaymentRow = {
    status?: string | null;
    checkout_request_id?: string | null;
    transaction_id?: string | null;
    result_desc?: string | null;
};

/**
 * Subscribe to realtime updates for a payment row; also poll periodically so UX works if Realtime is off.
 */
export function followStkPaymentCompletion(
    supabase: SupabaseClient,
    userId: string,
    checkoutRequestId: string,
    onUpdate: (row: PaymentRow) => void,
    options?: { pollMs?: number; maxPolls?: number },
): () => void {
    const pollMs = options?.pollMs ?? 3500;
    const maxPolls = options?.maxPolls ?? 28;

    let stopped = false;
    let pollCount = 0;

    const channel = supabase
        .channel(`stk-follow-${userId}-${checkoutRequestId}-${Date.now()}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` },
            (payload: any) => {
                const row = (payload?.new ?? payload?.old) as PaymentRow | undefined;
                if (!row || String(row.checkout_request_id ?? '') !== checkoutRequestId) return;
                onUpdate(row);
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
            if (!error && data) onUpdate(data as PaymentRow);
        } catch {
            /* ignore */
        }
        pollCount += 1;
        if (!stopped && pollCount < maxPolls) setTimeout(poll, pollMs);
    };
    setTimeout(poll, pollMs);

    return () => {
        stopped = true;
        supabase.removeChannel(channel);
    };
}
