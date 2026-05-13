import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { TurtleLogo } from '@/components/TurtleLogo';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, type AppRole } from '@/hooks/useUserRole';

const STORAGE_KEY = 'toddy.tourBubble';

type Slide = { title: string; desc: string };

const TOURS: Record<Exclude<AppRole, 'admin'> | 'default', Slide[]> = {
  patient: [
    { title: 'Checka in en gång om dagen', desc: 'Fyll i mående, sömn och eventuella mediciner. Vi guidar dig hela vägen – det tar under en minut.' },
    { title: 'Översikten visar dina mönster', desc: 'Vid bipolär syns episoder över veckor – inte timmar. Zooma ut och se hur du faktiskt mått.' },
    { title: 'Bjud in läkare eller anhöriga', desc: 'Du bestämmer själv vad de ser. Bjud in från profilen när du är redo – inte en sekund tidigare.' },
    { title: 'Fråga Toddy när du undrar', desc: 'Toddy kan svara på frågor om din egen data, läkemedel och mönster. Helt privat.' },
  ],
  doctor: [
    { title: 'Dina patienter samlade', desc: 'På startsidan ser du alla patienter som delat sin data med dig – sorterat efter senaste aktivitet.' },
    { title: 'Klicka in på en patient', desc: 'Du ser mående, sömn, läkemedel och mönster över tid. Episoder vid bipolär framträder tydligt.' },
    { title: 'Bjud in nya patienter', desc: 'Skicka en inbjudan från "Anslutningar". Patienten godkänner och bestämmer själv vad du får se.' },
    { title: 'Rapporter inför besök', desc: 'Generera en sammanfattning för valt tidsspann – perfekt att läsa igenom innan mottagningen.' },
  ],
  relative: [
    { title: 'Du följer en närstående', desc: 'På "Personer du följer" ser du sammanfattningar av det som personen valt att dela med dig.' },
    { title: 'Mönster, inte detaljer', desc: 'Du ser övergripande hur personen mår – inte varje liten anteckning. Integriteten ligger hos dem.' },
    { title: 'Var ett lugnt stöd', desc: 'Använd det du ser för att fråga, lyssna och finnas där. Toddy ersätter inte ett samtal.' },
  ],
  default: [
    { title: 'Välkommen till Toddy', desc: 'Toddy är din lugna stämningsdagbok. Checka in dagligen och se hur du mår över tid.' },
    { title: 'Översikt och mönster', desc: 'På översikten ser du hur du mått – över veckor, månader och år.' },
    { title: 'Du bestämmer vad du delar', desc: 'Bjud in läkare eller anhöriga när du är redo. Du har full kontroll.' },
  ],
};

export const TourBubble = () => {
  const { user } = useAuth();
  const { role, isLoading } = useUserRole();
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!user || isLoading) return;
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEY}.${user.id}`;
    if (localStorage.getItem(key) === '1') return;
    const t = setTimeout(() => {
      setMounted(true);
      // peek the bubble open the first time so user notices it
      setTimeout(() => setBubbleOpen(true), 300);
    }, 1200);
    return () => clearTimeout(t);
  }, [user, isLoading]);

  const dismissForever = () => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY}.${user.id}`, '1');
    }
    setBubbleOpen(false);
    setTourOpen(false);
    setMounted(false);
  };

  const slides =
    role && role !== 'admin' ? TOURS[role] : TOURS.default;
  const slide = slides[index];

  if (!mounted) return null;

  return (
    <>
      {/* Floating turtle in corner */}
      <div
        className="fixed z-[90] right-4 pointer-events-none"
        style={{ bottom: 'calc(var(--tabbar-height, 0px) + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <AnimatePresence>
            {bubbleOpen && !tourOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.92 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="relative max-w-[260px] rounded-2xl bg-[hsl(230_30%_10%)] ring-1 ring-white/10 shadow-2xl p-3.5 pr-8"
              >
                <button
                  onClick={dismissForever}
                  aria-label="Stäng"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white/35 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[13px] text-white/85 leading-snug font-medium">
                  Vill du ha en rundtur?
                </p>
                <p className="mt-0.5 text-[12px] text-white/50 leading-snug">
                  Så funkar Toddy – tar under en minut.
                </p>
                <button
                  onClick={() => {
                    setIndex(0);
                    setTourOpen(true);
                    setBubbleOpen(false);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[hsl(45_85%_55%)] hover:text-[hsl(45_85%_65%)] transition-colors"
                >
                  Ja, visa mig
                  <ArrowRight className="w-3 h-3" />
                </button>
                {/* Tail */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45 bg-[hsl(230_30%_10%)] ring-1 ring-white/10 ring-t-0 ring-l-0" />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setBubbleOpen((b) => !b)}
            aria-label={bubbleOpen ? 'Stäng rundtur' : 'Öppna rundtur'}
            className="relative w-14 h-14 rounded-full bg-[hsl(230_30%_10%)] ring-1 ring-white/10 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <TurtleLogo size="sm" animated className="w-10 h-10" />
            {!bubbleOpen && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(45_85%_55%)] ring-2 ring-[hsl(230_30%_5%)]" />
            )}
          </button>
        </div>
      </div>

      {/* Tour modal */}
      <AnimatePresence>
        {tourOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[hsl(230_30%_5%/0.85)] backdrop-blur-md flex items-end md:items-center justify-center p-5"
            onClick={() => setTourOpen(false)}
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
                onClick={() => setTourOpen(false)}
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
                <p className="mt-2 text-base text-white/65 leading-relaxed">
                  {slide.desc}
                </p>
              </div>

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
                onClick={() => {
                  if (index < slides.length - 1) setIndex((i) => i + 1);
                  else dismissForever();
                }}
                className="mt-5 w-full h-12 rounded-full text-[15px] font-semibold bg-[hsl(45_85%_55%)] text-[hsl(230_30%_5%)] hover:bg-[hsl(45_85%_65%)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                {index < slides.length - 1 ? 'Nästa' : 'Nu kör vi'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {index < slides.length - 1 && (
                <button
                  onClick={() => setTourOpen(false)}
                  className="mt-3 w-full text-xs text-white/40 hover:text-white/65 transition-colors py-1"
                >
                  Stäng
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
