import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Loggar varje route-byte till page_views för inloggade användare.
 * Demo-användare exkluderas.
 */
export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const lastLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta.is_demo === true || meta.is_demo_seed === true) return;

    const path = location.pathname || '/';
    // Undvik dubbla loggar vid samma path (t.ex. snabba re-renders)
    if (lastLoggedRef.current === path) return;
    lastLoggedRef.current = path;

    supabase.from('page_views').insert({ user_id: user.id, path }).then(({ error }) => {
      if (error) console.warn('[page_views] insert failed', error.message);
    });
  }, [location.pathname, user?.id]);
}
