import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'toddy.firstRunTour.dismissed';

const slides = [
  {
    title: 'Här gör du din incheckning',
    desc: 'En gång om dagen. Mående, sömn och eventuella mediciner. Vi guidar dig steg för steg.',
  },
  {
    title: 'Översikten visar dina mönster',
    desc: 'Episoder vid bipolär syns över veckor – inte timmar. I översikten kan du zooma ut och se hur du mått.',
  },
  {
    title: 'Du är inte ensam',
    desc: 'Bjud in läkare eller anhöriga från profilen när du är redo. De ser bara det du delar.',
  },
];

/**
 * Visas en gång efter att en ny användare landat på startsidan första gången.
 * Använder localStorage per användar-id så samma device kan ha flera konton
 * utan att touren visas igen.
 */
export const FirstRunTour = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;

    // Visa endast för helt nya konton (skapade senaste 5 min) – inte för
    // befintliga användare som loggar in på ny enhet eller rensat storage.
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const isBrandNew = createdAt > 0 && Date.now() - createdAt < 5 * 60 * 1000;
    if (!isBrandNew) return;

    const key = `${STORAGE_KEY}.${user.id}`;
    if (localStorage.getItem(key) === '1') return;

    // Liten fördröjning så användaren först ser sidan, sedan touren
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user]);

  const dismiss = () => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY}.${user.id}`, '1');
    }
    setOpen(false);
  };

  const next = () => {
    if (index < slides.length - 1) setIndex((i) => i + 1);
    else dismiss();
  };

  const slide = slides[index];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[hsl(230_30%_5%/0.85)] backdrop-blur-md flex items-end md:items-center justify-center p-5"
          onClick={dismiss}
        >
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[hsl(230_30%_10%)] ring-1 ring-white/10 shadow-2xl p-6 relative"
          >
            <button
              onClick={dismiss}
              aria-label="Stäng"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <TurtleLogo size="lg" animated className="w-20 h-20 mb-4 drop-shadow-[0_4px_20px_hsl(45_85%_55%/0.3)]" />
              <h2 className="text-xl font-bold text-white font-display tracking-tight">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                {slide.desc}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-[hsl(45_85%_55%)]' : 'w-1.5 bg-white/15'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="mt-5 w-full h-12 rounded-2xl text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              {index < slides.length - 1 ? 'Nästa' : 'Nu kör vi'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {index < slides.length - 1 && (
              <button
                onClick={dismiss}
                className="mt-3 w-full text-xs text-white/35 hover:text-white/60 transition-colors py-1"
              >
                Hoppa över
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
