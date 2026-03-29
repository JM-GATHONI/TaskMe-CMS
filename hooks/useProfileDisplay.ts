import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type ProfileRow = {
    first_name?: string | null;
    full_name?: string | null;
};

type UseProfileDisplayOptions = {
    /** When profile first_name/full_name is empty or looks like email, use first word of this as display name */
    nameFallback?: string | null;
};

export function useProfileDisplay(options?: UseProfileDisplayOptions) {
    const nameFallback = options?.nameFallback;
    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [metaFirstName, setMetaFirstName] = useState<string | null>(null);
    const [metaFullName, setMetaFullName] = useState<string | null>(null);
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
                if (alive) {
                    const metadata = (user.user_metadata ?? {}) as any;
                    setMetaFirstName((metadata.first_name ?? null) as string | null);
                    setMetaFullName((metadata.full_name ?? null) as string | null);
                }

                const { data: prof } = await supabase
                    .from('profiles')
                    .select('first_name, full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!alive) return;
                setProfile((prof as any) ?? null);

                // Permanent fix: ensure public.profiles has a stable first_name/full_name so all headers
                // can reliably render a first name (even if metadata drifts or app_state is empty).
                try {
                    const looksLikeEmail = (s: string) => s.includes('@');
                    const pickFirstWord = (s: string) => s.trim().split(/\s+/).filter(Boolean)[0] || '';
                    const emailLocal = (user.email ?? '').split('@')[0] || '';

                    const profFirst = String((prof as any)?.first_name ?? '').trim();
                    const profFull = String((prof as any)?.full_name ?? '').trim();
                    const metaFirst = String(((user.user_metadata as any)?.first_name ?? '')).trim();
                    const metaFull = String(((user.user_metadata as any)?.full_name ?? '')).trim();
                    const fallback = String(nameFallback ?? '').trim();

                    const candidateFull =
                        (profFull && !looksLikeEmail(profFull) ? profFull : '') ||
                        (metaFull && !looksLikeEmail(metaFull) ? metaFull : '') ||
                        (fallback && !looksLikeEmail(fallback) ? fallback : '') ||
                        (metaFirst && !looksLikeEmail(metaFirst) ? metaFirst : '') ||
                        (emailLocal ? emailLocal : '');

                    const candidateFirst =
                        (profFirst && !looksLikeEmail(profFirst) ? profFirst : '') ||
                        (metaFirst && !looksLikeEmail(metaFirst) ? metaFirst : '') ||
                        pickFirstWord(candidateFull) ||
                        'User';

                    const safeFirst = candidateFirst.trim() || 'User';
                    const safeFull = (candidateFull && !looksLikeEmail(candidateFull) ? candidateFull : safeFirst).trim();

                    const needUpsert =
                        !profFirst ||
                        looksLikeEmail(profFirst) ||
                        !profFull ||
                        looksLikeEmail(profFull);

                    if (needUpsert && safeFirst && safeFirst !== 'User') {
                        await supabase.from('profiles').upsert(
                            { id: user.id, first_name: safeFirst, full_name: safeFull, email: user.email ?? null },
                            { onConflict: 'id' },
                        );
                    }
                } catch {
                    // non-blocking
                }
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
        const looksLikeEmail = (s: string) => s.includes('@');
        const fromProfile = first || full;
        if (fromProfile && !looksLikeEmail(fromProfile)) return fromProfile.split(/\s+/)[0];
        const metaFirst = (metaFirstName ?? '').trim();
        const metaFull = (metaFullName ?? '').trim();
        const fromMeta = metaFirst || metaFull;
        if (fromMeta && !looksLikeEmail(fromMeta)) return fromMeta.split(/\s+/)[0];
        const fallbackFirst = nameFallback?.trim()?.split(/\s+/)[0];
        if (fallbackFirst && !looksLikeEmail(fallbackFirst)) return fallbackFirst;
        const local = (email ?? '').split('@')[0]?.trim();
        if (local) return local.split(/[._-]/)[0] || 'User';
        return 'User';
    }, [loading, profile?.first_name, profile?.full_name, metaFirstName, metaFullName, email, nameFallback]);

    const initial = useMemo(() => {
        const d = (displayName ?? '').trim();
        return (d ? d.charAt(0) : 'U').toUpperCase();
    }, [displayName]);

    return { loading, profile, email, displayName, initial };
}

