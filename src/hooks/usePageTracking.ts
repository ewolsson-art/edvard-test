import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Loggar varje route-byte till page_views för inloggade användare.
 * Demo-användare exkluderas. Sparar även referrer + UTM-parametrar
 * (sticky per session) så vi kan se varifrån användarna kommer.
 */

const SESSION_REFERRER_KEY = 'toddy.session.referrer';
const SESSION_UTM_KEY = 'toddy.session.utm';

type UtmData = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

function normalizeReferrer(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // Räkna inte interna navigationer som referrer
    if (u.hostname === window.location.hostname) return null;
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getOrInitSessionSource(): { referrer: string | null; utm: UtmData } {
  let referrer: string | null = null;
  let utm: UtmData = {};

  try {
    const storedRef = sessionStorage.getItem(SESSION_REFERRER_KEY);
    const storedUtm = sessionStorage.getItem(SESSION_UTM_KEY);
    if (storedRef !== null) referrer = storedRef || null;
    if (storedUtm) utm = JSON.parse(storedUtm);
    if (storedRef !== null || storedUtm) return { referrer, utm };
  } catch {}

  // Första vyn i sessionen — fånga referrer + UTM
  referrer = normalizeReferrer(document.referrer || '');
  const params = new URLSearchParams(window.location.search);
  utm = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };

  try {
    sessionStorage.setItem(SESSION_REFERRER_KEY, referrer ?? '');
    sessionStorage.setItem(SESSION_UTM_KEY, JSON.stringify(utm));
  } catch {}

  return { referrer, utm };
}

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const lastLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta.is_demo === true || meta.is_demo_seed === true) return;

    const path = location.pathname || '/';
    if (lastLoggedRef.current === path) return;
    lastLoggedRef.current = path;

    const { referrer, utm } = getOrInitSessionSource();

    supabase.from('page_views').insert({
      user_id: user.id,
      path,
      referrer,
      utm_source: utm.utm_source ?? null,
      utm_medium: utm.utm_medium ?? null,
      utm_campaign: utm.utm_campaign ?? null,
    }).then(({ error }) => {
      if (error) console.warn('[page_views] insert failed', error.message);
    });
  }, [location.pathname, user?.id]);
}
