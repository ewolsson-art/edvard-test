import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRelativeConnections, PatientConnection } from '@/hooks/useRelativeConnections';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOOD_LABELS, MOOD_ICONS, MoodType } from '@/types/mood';
import { format } from 'date-fns';

interface TodayMood {
  mood: MoodType;
  sleep_quality?: string | null;
  eating_quality?: string | null;
  exercised?: boolean | null;
  created_at?: string;
}

const MOOD_COLORS: Record<MoodType, string> = {
  elevated: 'bg-mood-elevated/15 border-mood-elevated/30',
  somewhat_elevated: 'bg-mood-somewhat-elevated/15 border-mood-somewhat-elevated/30',
  stable: 'bg-mood-stable/15 border-mood-stable/30',
  somewhat_depressed: 'bg-mood-somewhat-depressed/15 border-mood-somewhat-depressed/30',
  depressed: 'bg-mood-depressed/15 border-mood-depressed/30',
};

const MOOD_TEXT_COLORS: Record<MoodType, string> = {
  elevated: 'text-mood-elevated',
  somewhat_elevated: 'text-mood-somewhat-elevated',
  stable: 'text-mood-stable',
  somewhat_depressed: 'text-mood-somewhat-depressed',
  depressed: 'text-mood-depressed',
};

const QUALITY_MAP: Record<string, string> = {
  good: 'Bra',
  okay: 'Ok',
  bad: 'Dåligt',
};

const RelativeDashboard = () => {
  const navigate = useNavigate();
  const { approvedConnections, isLoading } = useRelativeConnections();
  const [todayMoods, setTodayMoods] = useState<Record<string, TodayMood | null>>({});
  const [moodsLoading, setMoodsLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchTodayMoods = async () => {
      if (approvedConnections.length === 0) {
        setMoodsLoading(false);
        return;
      }

      const results: Record<string, TodayMood | null> = {};

      await Promise.all(
        approvedConnections.map(async (conn) => {
          if (!conn.share_mood) {
            results[conn.patient_id] = null;
            return;
          }
          const { data } = await supabase
            .from('mood_entries')
            .select('mood, sleep_quality, eating_quality, exercised, created_at')
            .eq('user_id', conn.patient_id)
            .eq('date', today)
            .maybeSingle();

          results[conn.patient_id] = data
            ? { mood: data.mood as MoodType, sleep_quality: data.sleep_quality, eating_quality: data.eating_quality, exercised: data.exercised, created_at: data.created_at }
            : null;
        })
      );

      setTodayMoods(results);
      setMoodsLoading(false);
    };

    if (!isLoading) {
      fetchTodayMoods();
    }
  }, [approvedConnections, isLoading, today]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPatientName = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name || connection.patient_profile?.last_name) {
      return [connection.patient_profile.first_name, connection.patient_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    if (connection.patient_email) {
      return connection.patient_email;
    }
    return 'Användare';
  };

  const getPatientInitial = (connection: PatientConnection) => {
    if (connection.patient_profile?.first_name) {
      return connection.patient_profile.first_name[0].toUpperCase();
    }
    if (connection.patient_email) {
      return connection.patient_email[0].toUpperCase();
    }
    return 'A';
  };

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="max-w-3xl md:mx-0 space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Hem
          </h1>
          <p className="text-muted-foreground">
            Översikt över hur dina närstående mår idag
          </p>
        </header>

        {approvedConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-medium">Inga personer ännu</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Gå till Följer-sidan för att begära åtkomst till någon du vill följa.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate('/foljer')}
            >
              Gå till Följer
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedConnections.map((connection) => {
              const todayEntry = todayMoods[connection.patient_id];
              const hasCheckedIn = todayEntry !== null && todayEntry !== undefined;
              const name = getPatientName(connection);

              return (
                <button
                  key={connection.id}
                  className="w-full text-left rounded-2xl border p-5 transition-all hover:shadow-md active:scale-[0.99] bg-card/60 border-border/30"
                  onClick={() => navigate(`/patient/${connection.patient_id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-primary">
                        {getPatientInitial(connection)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-base truncate">{name}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      </div>

                      {moodsLoading ? (
                        <div className="h-4 w-24 bg-foreground/5 rounded animate-pulse mt-1.5" />
                      ) : hasCheckedIn ? (
                        <div className="mt-2 space-y-2">
                          {/* Mood badge */}
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${MOOD_COLORS[todayEntry.mood]}`}>
                            <span className="text-base">{MOOD_ICONS[todayEntry.mood]}</span>
                            <span className={`text-sm font-medium ${MOOD_TEXT_COLORS[todayEntry.mood]}`}>
                              {MOOD_LABELS[todayEntry.mood]}
                            </span>
                          </div>

                          {/* Extra data chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {todayEntry.sleep_quality && connection.share_sleep && (
                              <span className="text-[11px] bg-foreground/[0.04] text-muted-foreground px-2 py-1 rounded-lg">
                                Sömn: {QUALITY_MAP[todayEntry.sleep_quality] || todayEntry.sleep_quality}
                              </span>
                            )}
                            {todayEntry.eating_quality && connection.share_eating && (
                              <span className="text-[11px] bg-foreground/[0.04] text-muted-foreground px-2 py-1 rounded-lg">
                                Kost: {QUALITY_MAP[todayEntry.eating_quality] || todayEntry.eating_quality}
                              </span>
                            )}
                            {todayEntry.exercised !== null && todayEntry.exercised !== undefined && connection.share_exercise && (
                              <span className="text-[11px] bg-foreground/[0.04] text-muted-foreground px-2 py-1 rounded-lg">
                                Träning: {todayEntry.exercised ? 'Ja' : 'Nej'}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 mt-1">
                          Har inte checkat in idag ännu
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelativeDashboard;
