import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type ProfileRow = {
    first_name?: string | null;
    full_name?: string | null;
};

export function useProfileDisplay() {
    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        const run = async () => {
            setLoading(true);
            try {
                const { data: userRes } = await supabase.auth.getUser();
                const user = userRes.user;
                if (!user) {
                    if (!alive) return;
                    setProfile(null);
                    setEmail(null);
                    return;
                }
                if (alive) setEmail(user.email ?? null);

                const { data: prof } = await supabase
                    .from('profiles')
                    .select('first_name, full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!alive) return;
                setProfile((prof as any) ?? null);
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

    const displayName = useMemo(() => {
        if (loading) return 'Loading...';
        const first = (profile?.first_name ?? '').trim();
        const full = (profile?.full_name ?? '').trim();
        return first || full || email || 'User';
    }, [loading, profile?.first_name, profile?.full_name, email]);

    const initial = useMemo(() => {
        const d = (displayName ?? '').trim();
        return (d ? d.charAt(0) : 'U').toUpperCase();
    }, [displayName]);

    return { loading, profile, email, displayName, initial };
}

