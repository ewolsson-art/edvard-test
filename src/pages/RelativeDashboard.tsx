import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRelativeConnections, PatientConnection } from '@/hooks/useRelativeConnections';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, ChevronRight, UserPlus, X, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MOOD_LABELS as DEFAULT_MOOD_LABELS, MOOD_ICONS, MoodType } from '@/types/mood';
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
  severe_elevated: 'bg-mood-severe-elevated/15 border-mood-severe-elevated/30',
  elevated: 'bg-mood-elevated/15 border-mood-elevated/30',
  somewhat_elevated: 'bg-mood-somewhat-elevated/15 border-mood-somewhat-elevated/30',
  stable: 'bg-mood-stable/15 border-mood-stable/30',
  somewhat_depressed: 'bg-mood-somewhat-depressed/15 border-mood-somewhat-depressed/30',
  depressed: 'bg-mood-depressed/15 border-mood-depressed/30',
  severe_depressed: 'bg-mood-severe-depressed/15 border-mood-severe-depressed/30',
};

const MOOD_TEXT_COLORS: Record<MoodType, string> = {
  severe_elevated: 'text-mood-severe-elevated',
  elevated: 'text-mood-elevated',
  somewhat_elevated: 'text-mood-somewhat-elevated',
  stable: 'text-mood-stable',
  somewhat_depressed: 'text-mood-somewhat-depressed',
  depressed: 'text-mood-depressed',
  severe_depressed: 'text-mood-severe-depressed',
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

const emailSchema = z.string().email({ message: "Ogiltig e-postadress" });

const RelativeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { approvedConnections, pendingFromRelative, isLoading, requestPatientAccess, cancelRequest } = useRelativeConnections();
  const [patientData, setPatientData] = useState<Record<string, PatientMoodData | null>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

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

  const handleRequestAccess = async () => {
    const result = emailSchema.safeParse(patientEmail);
    if (!result.success) {
      toast({ title: "Ogiltig e-postadress", variant: "destructive" });
      return;
    }
    setIsRequesting(true);
    const { success, error } = await requestPatientAccess(patientEmail);
    setIsRequesting(false);
    if (success) {
      setPatientEmail('');
      setRequestDialogOpen(false);
    } else if (error) {
      toast({ title: "Kunde inte skicka förfrågan", description: error, variant: "destructive" });
    }
  };


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
        <header className="flex items-start justify-between mb-1">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
              Hem
            </h1>
            <p className="text-sm text-muted-foreground">
              Översikt över hur dina närstående mår idag
            </p>
          </div>
          {approvedConnections.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0 mt-1"
              onClick={() => setRequestDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Begär åtkomst
            </Button>
          )}
        </header>

        {/* Pending requests */}
        {pendingFromRelative.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Väntande förfrågningar
            </p>
            {pendingFromRelative.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-foreground/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {getPatientInitial(connection)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{getPatientName(connection)}</span>
                    <p className="text-xs text-muted-foreground">Väntar på svar</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  onClick={() => cancelRequest(connection.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {approvedConnections.length === 0 && pendingFromRelative.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-full bg-foreground/[0.04] flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground/60" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-base font-medium text-muted-foreground">Inga personer ännu</p>
              <p className="text-sm text-muted-foreground/60 max-w-[260px]">
                Begär åtkomst till någon du bryr dig om för att följa deras mående
              </p>
            </div>
            <Button
              onClick={() => setRequestDialogOpen(true)}
              className="gap-2 mt-2 h-11 px-6 text-sm font-semibold rounded-full bg-[hsl(45,85%,55%)] hover:bg-[hsl(45,85%,50%)] text-black shadow-[0_0_20px_hsl(45,85%,55%,0.15)]"
            >
              <UserPlus className="w-4 h-4" />
              Följ din första person
            </Button>
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
                  <div className="flex gap-4">
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
                      <h3 className="font-semibold text-base truncate">{name}</h3>

                      {dataLoading ? (
                        <div className="h-4 w-32 bg-foreground/5 rounded animate-pulse mt-2" />
                      ) : hasCheckedIn ? (
                        <div className="mt-2 space-y-2">
                          {/* Mood badge + timestamp */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${MOOD_COLORS[entry.mood]}`}>
                              <span className="text-sm">{MOOD_ICONS[entry.mood]}</span>
                              <span className={`text-xs font-semibold ${MOOD_TEXT_COLORS[entry.mood]}`}>
                                {DEFAULT_MOOD_LABELS[entry.mood]}
                              </span>
                            </div>
                          </div>
                          {entry.created_at && (
                            <p className="text-[11px] text-muted-foreground/40">
                              Checkade in {formatCheckinTime(entry.created_at).toLowerCase()}
                            </p>
                          )}

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

                    {/* Chevron centered vertically */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 self-center transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/50" />
                  </div>
                </button>
              );
            })}

          </div>
        )}
        {/* Request dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Begär åtkomst</DialogTitle>
              <DialogDescription>
                Ange e-postadressen till personen du vill följa för att skicka en förfrågan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="patientEmail">E-postadress</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  placeholder="namn@example.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  disabled={isRequesting}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Personen kommer att kunna godkänna eller avvisa din förfrågan och välja vilken data du får se.
              </p>
              <Button onClick={handleRequestAccess} disabled={isRequesting} className="w-full gap-2">
                {isRequesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Skicka förfrågan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RelativeDashboard;
