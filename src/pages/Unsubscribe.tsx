import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TurtleLogo } from '@/components/TurtleLogo';

type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'already' }
  | { kind: 'ready'; email: string }
  | { kind: 'submitting' }
  | { kind: 'done'; email: string }
  | { kind: 'error'; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', message: 'Länken saknar token.' });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data?.status === 'already_unsubscribed') {
            setState({ kind: 'already' });
            return;
          }
          setState({ kind: 'invalid', message: data?.error || 'Länken är ogiltig eller har gått ut.' });
          return;
        }
        if (data?.status === 'already_unsubscribed') {
          setState({ kind: 'already' });
          return;
        }
        setState({ kind: 'ready', email: data?.email || '' });
      } catch {
        setState({ kind: 'invalid', message: 'Kunde inte verifiera länken.' });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (state.kind !== 'ready') return;
    setState({ kind: 'submitting' });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: 'error', message: data?.error || 'Något gick fel.' });
        return;
      }
      setState({ kind: 'done', email: data?.email || (state as any).email || '' });
    } catch {
      setState({ kind: 'error', message: 'Något gick fel. Försök igen.' });
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[hsl(225_30%_5%)] px-5">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
        <div className="flex justify-center mb-5">
          <TurtleLogo size="sm" className="w-12 h-12" />
        </div>

        {state.kind === 'loading' && (
          <p className="text-base text-white/70">Verifierar länken…</p>
        )}

        {state.kind === 'invalid' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Länken är ogiltig</h1>
            <p className="text-base text-white/60">{state.message}</p>
          </>
        )}

        {state.kind === 'already' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Du är redan avregistrerad</h1>
            <p className="text-base text-white/60">Vi skickar inga fler mejl till denna adress.</p>
          </>
        )}

        {(state.kind === 'ready' || state.kind === 'submitting') && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Avregistrera mejl</h1>
            <p className="text-base text-white/70 mb-6">
              {state.kind === 'ready' && state.email
                ? `Vill du sluta få mejl från Toddy till ${state.email}?`
                : 'Vill du sluta få mejl från Toddy?'}
            </p>
            <button
              onClick={confirm}
              disabled={state.kind === 'submitting'}
              className="w-full rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_5%)] text-base font-semibold px-6 py-3 disabled:opacity-60"
            >
              {state.kind === 'submitting' ? 'Avregistrerar…' : 'Bekräfta avregistrering'}
            </button>
          </>
        )}

        {state.kind === 'done' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Klart</h1>
            <p className="text-base text-white/60">
              {state.email
                ? `${state.email} är nu avregistrerad. Vi skickar inga fler mejl dit.`
                : 'Du är nu avregistrerad.'}
            </p>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Ett fel uppstod</h1>
            <p className="text-base text-white/60">{state.message}</p>
          </>
        )}

        <Link
          to="/"
          className="mt-8 inline-block text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Tillbaka till Toddy
        </Link>
      </div>
    </div>
  );
}
