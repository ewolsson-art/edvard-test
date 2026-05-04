import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';

interface NewUserOverviewHintProps {
  entryCount: number;
}

/**
 * Visas i översikten när användaren fortfarande har färre än 3 incheckningar.
 * Förklarar varmt vad som kommer hända här – istället för en tom yta.
 */
export const NewUserOverviewHint = ({ entryCount }: NewUserOverviewHintProps) => {
  if (entryCount >= 3) return null;

  const remaining = Math.max(0, 3 - entryCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="mb-5 rounded-3xl bg-gradient-to-br from-[hsl(45_85%_55%/0.08)] to-transparent ring-1 ring-[hsl(45_85%_55%/0.15)] p-5"
    >
      <div className="flex items-start gap-3">
        <TurtleLogo size="sm" className="w-12 h-12 shrink-0 drop-shadow-[0_4px_12px_hsl(45_85%_55%/0.25)]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[hsl(45_85%_55%)]" />
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[hsl(45_85%_55%)]">
              Snart full av insikter
            </p>
          </div>
          <h3 className="text-base font-semibold text-foreground leading-snug">
            {entryCount === 0
              ? 'Här kommer ditt mående synas över tid'
              : `${remaining} incheckning${remaining === 1 ? '' : 'ar'} till och vi börjar se mönster`}
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Bipolär syns över veckor – inte timmar. Ju fler dagar du checkar in, desto tydligare blir bilden av dina episoder, sömn och triggers.
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(45_85%_55%)] hover:gap-2 transition-all"
          >
            Gå till dagens incheckning
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
