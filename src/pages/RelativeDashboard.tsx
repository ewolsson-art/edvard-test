import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRelativeConnections, PatientConnection } from '@/hooks/useRelativeConnections';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MOOD_LABELS, MOOD_ICONS, MoodType } from '@/types/mood';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';

const formatCheckinTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const time = format(d, 'HH:mm');
  if (isToday(d)) return `Idag, ${time}`;
  if (isYesterday(d)) return `Igår, ${time}`;
  return format(d, 'd MMM, HH:mm', { locale: sv });
};

interface PatientMoodData {
  mood: MoodType;
  eating_quality?: string | null;
  exercised?: boolean | null;
  created_at?: string;
  streak?: number;
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

function calculateStreak(entries: { date: string; mood: string }[], currentMood: string): number {
  let streak = 1;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  // Start from most recent (today), count consecutive same mood
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].mood === currentMood) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const RelativeDashboard = () => {
  const navigate = useNavigate();
  const { approvedConnections, isLoading } = useRelativeConnections();
  const [patientData, setPatientData] = useState<Record<string, PatientMoodData | null>>({});
  const [dataLoading, setDataLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchData = async () => {
      if (approvedConnections.length === 0) {
        setDataLoading(false);
        return;
      }

      const results: Record<string, PatientMoodData | null> = {};

      await Promise.all(
        approvedConnections.map(async (conn) => {
          if (!conn.share_mood) {
            results[conn.patient_id] = null;
            return;
          }

          // Fetch last 7 days of entries for streak calculation
          const { data: entries } = await supabase
            .from('mood_entries')
            .select('mood, eating_quality, exercised, created_at, date')
            .eq('user_id', conn.patient_id)
            .gte('date', weekAgo)
            .lte('date', today)
            .order('date', { ascending: false });

          if (!entries || entries.length === 0) {
            results[conn.patient_id] = null;
            return;
          }

          const todayEntry = entries.find(e => e.date === today);
          if (!todayEntry) {
            results[conn.patient_id] = null;
            return;
          }

          const streak = calculateStreak(entries, todayEntry.mood);

          results[conn.patient_id] = {
            mood: todayEntry.mood as MoodType,
            eating_quality: todayEntry.eating_quality,
            exercised: todayEntry.exercised,
            created_at: todayEntry.created_at,
            streak,
          };
        })
      );

      setPatientData(results);
      setDataLoading(false);
    };

    if (!isLoading) {
      fetchData();
    }
  }, [approvedConnections, isLoading, today, weekAgo]);

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
      <div className="max-w-2xl md:mx-0 space-y-5">
        <header className="mb-1">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
            Hem
          </h1>
          <p className="text-sm text-muted-foreground">
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
            <button
              onClick={() => navigate('/foljer')}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Lägg till person
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedConnections.map((connection) => {
              const entry = patientData[connection.patient_id];
              const hasCheckedIn = entry !== null && entry !== undefined;
              const name = getPatientName(connection);

              return (
                <button
                  key={connection.id}
                  className="group w-full text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-[0_0_24px_hsl(var(--primary)/0.06)] hover:border-border/50 hover:scale-[1.01] active:scale-[0.99] bg-card/60 border-border/30 backdrop-blur-sm"
                  onClick={() => navigate(`/patient/${connection.patient_id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 shrink-0 ring-1 ring-white/[0.06]">
                      {connection.patient_profile?.avatar_url ? (
                        <AvatarImage src={connection.patient_profile.avatar_url} alt={name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getPatientInitial(connection)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-base truncate">{name}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/50" />
                      </div>

                      {dataLoading ? (
                        <div className="h-4 w-32 bg-foreground/5 rounded animate-pulse mt-2" />
                      ) : hasCheckedIn ? (
                        <div className="mt-2 space-y-2">
                          {/* Mood badge + streak + timestamp */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${MOOD_COLORS[entry.mood]}`}>
                              <span className="text-sm">{MOOD_ICONS[entry.mood]}</span>
                              <span className={`text-xs font-semibold ${MOOD_TEXT_COLORS[entry.mood]}`}>
                                {MOOD_LABELS[entry.mood]}
                              </span>
                            </div>
                            {entry.streak && entry.streak >= 2 && (
                              <span className="text-[11px] text-muted-foreground/50 font-medium">
                                {entry.streak} dagar i rad
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground/35">
                              ·
                            </span>
                            {entry.created_at && (
                              <span className="text-[11px] text-muted-foreground/40">
                                {formatCheckinTime(entry.created_at)}
                              </span>
                            )}
                          </div>

                          {/* Extra data chips */}
                          {((entry.eating_quality && connection.share_eating) || 
                            (entry.exercised !== null && entry.exercised !== undefined && connection.share_exercise)) && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.eating_quality && connection.share_eating && (
                                <span className="text-[11px] bg-foreground/[0.04] text-muted-foreground/60 px-2 py-0.5 rounded-md">
                                  Kost: {QUALITY_MAP[entry.eating_quality] || entry.eating_quality}
                                </span>
                              )}
                              {entry.exercised !== null && entry.exercised !== undefined && connection.share_exercise && (
                                <span className="text-[11px] bg-foreground/[0.04] text-muted-foreground/60 px-2 py-0.5 rounded-md">
                                  Träning: {entry.exercised ? 'Ja ✓' : 'Nej'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/40 mt-1.5">
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
