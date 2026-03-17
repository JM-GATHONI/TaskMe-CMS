import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useProfileFirstName() {
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
                setFirstName(typeof fn === 'string' ? fn : null);
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
    }, []);

    return { firstName, loading };
}

