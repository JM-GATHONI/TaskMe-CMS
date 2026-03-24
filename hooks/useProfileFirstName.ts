import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type UseProfileFirstNameOptions = {
    /** When profile first_name is empty or looks like email, use first word of this */
    nameFallback?: string | null;
};

export function useProfileFirstName(options?: UseProfileFirstNameOptions) {
    const nameFallback = options?.nameFallback;
    const [firstName, setFirstName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        const run = async () => {
            setLoading(true);
            try {
                const { data: userRes, error: userErr } = await supabase.auth.getUser();
                if (userErr || !userRes.user) {
                    if (!alive) return;
                    setFirstName(null);
                    return;
                }

                const userId = userRes.user.id;
                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('first_name')
                    .eq('id', userId)
                    .maybeSingle();

                if (!alive) return;
                if (profileErr) {
                    setFirstName(null);
                    return;
                }
                const fn = (profile as any)?.first_name;
                const resolved = typeof fn === 'string' && fn.trim() && !fn.includes('@')
                    ? fn.trim()
                    : (nameFallback?.trim()?.split(/\s+/)[0] ?? null);
                setFirstName(resolved);
            } finally {
                if (alive) setLoading(false);
            }
        };

        run();

        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            run();
        });

        return () => {
            alive = false;
            sub.subscription.unsubscribe();
        };
    }, [nameFallback]);

    return { firstName, loading };
}

