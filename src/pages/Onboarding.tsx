import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Brain, Moon, Utensils, Dumbbell, Pill, 
  ArrowRight, ArrowLeft, Sparkles, TrendingUp, 
  Share2, MessageSquare, CheckCircle2, Stethoscope,
  Heart, Bell, UserPlus
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DarkNightBackground } from '@/components/DarkNightBackground';
import { DiagnosisStep } from '@/components/onboarding/DiagnosisStep';
import { MedicationStep, MedicationInput } from '@/components/onboarding/MedicationStep';
import { CharacteristicsStep, CharacteristicsInput } from '@/components/onboarding/CharacteristicsStep';
import { NotificationStep, NotificationSettings } from '@/components/onboarding/NotificationStep';
import { InviteStep, InviteInput } from '@/components/onboarding/InviteStep';
import { cn } from '@/lib/utils';

const CHECKIN_OPTIONS = [
  {
    id: 'include_mood',
    label: 'Mående',
    description: 'Registrera hur du mår varje dag',
    icon: Brain,
    recommended: true,
  },
  {
    id: 'include_sleep',
    label: 'Sömn',
    description: 'Håll koll på din sömnkvalitet',
    icon: Moon,
  },
  {
    id: 'include_eating',
    label: 'Kost',
    description: 'Följ dina matvanor',
    icon: Utensils,
  },
  {
    id: 'include_exercise',
    label: 'Träning',
    description: 'Logga din fysiska aktivitet',
    icon: Dumbbell,
  },
  {
    id: 'include_medication',
    label: 'Medicin',
    description: 'Loggning för dina mediciner',
    icon: Pill,
  },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Statistik & insikter',
    description: 'Se trender i ditt mående med tydliga grafer',
  },
  {
    icon: Share2,
    title: 'Dela med din läkare',
    description: 'Bjud in din läkare för att dela din data',
  },
  {
    icon: MessageSquare,
    title: 'AI-assistent',
    description: 'Chatta med vår AI för att reflektera',
  },
];

const TOTAL_STEPS = 8;

const Onboarding = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPreferences } = useUserPreferences();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step data
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [selections, setSelections] = useState({
    include_mood: true,
    include_sleep: true,
    include_eating: true,
    include_exercise: true,
    include_medication: true,
  });
  const [selectedMedications, setSelectedMedications] = useState<MedicationInput[]>([]);
  const [characteristics, setCharacteristics] = useState<CharacteristicsInput>({
    elevated: [],
    stable: [],
    depressed: [],
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    checkinEnabled: false,
    checkinTime: '20:00',
    medicationEnabled: false,
    medicationTime: '08:00',
  });
  const [invites, setInvites] = useState<InviteInput>({
    doctors: [],
    relatives: [],
  });

  const handleToggle = (id: string) => {
    setSelections(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const hasAnySelection = Object.values(selections).some(Boolean);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const getSkipText = () => {
    switch (step) {
      case 2: return selectedDiagnoses.length === 0 ? 'Hoppa över' : 'Fortsätt';
      case 4: return selectedMedications.length === 0 ? 'Hoppa över' : 'Fortsätt';
      case 5: 
        const totalChars = characteristics.elevated.length + characteristics.stable.length + characteristics.depressed.length;
        return totalChars === 0 ? 'Hoppa över' : 'Fortsätt';
      case 6:
        const anyNotif = notificationSettings.checkinEnabled || notificationSettings.medicationEnabled;
        return anyNotif ? 'Fortsätt' : 'Hoppa över';
      case 7:
        const anyInvite = invites.doctors.length > 0 || invites.relatives.length > 0;
        return anyInvite ? 'Fortsätt' : 'Hoppa över';
      default: return 'Fortsätt';
    }
  };

  const handleSubmit = async () => {
    if (!hasAnySelection) {
      toast({
        title: 'Välj minst ett alternativ',
        description: 'Du behöver välja minst en kategori för din dagliga incheckning.',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // 1. Save preferences
      const { error } = await createPreferences(selections);
      if (error) throw new Error('Kunde inte spara preferenser');

      // 2. Save diagnoses
      if (selectedDiagnoses.length > 0) {
        const diagnosesToInsert = selectedDiagnoses.map(name => ({
          user_id: user.id,
          name: name.trim(),
        }));
        await supabase.from('diagnoses').insert(diagnosesToInsert);
      }

      // 3. Save medications
      if (selectedMedications.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const medicationsToInsert = selectedMedications.map(med => ({
          user_id: user.id,
          name: med.name,
          dosage: med.dosage || 'Ej angiven',
          started_at: today,
          frequency: 'daily' as const,
        }));
        await supabase.from('medications').insert(medicationsToInsert);
      }

      // 4. Save characteristics
      const allCharacteristics = [
        ...characteristics.elevated.map(name => ({ user_id: user.id, name, mood_type: 'elevated' })),
        ...characteristics.stable.map(name => ({ user_id: user.id, name, mood_type: 'stable' })),
        ...characteristics.depressed.map(name => ({ user_id: user.id, name, mood_type: 'depressed' })),
      ];
      if (allCharacteristics.length > 0) {
        await supabase.from('characteristics').insert(allCharacteristics);
      }

      // 5. Save notification preferences
      if (notificationSettings.checkinEnabled || notificationSettings.medicationEnabled) {
        await supabase.from('notification_preferences').upsert({
          user_id: user.id,
          checkin_enabled: notificationSettings.checkinEnabled,
          checkin_time: notificationSettings.checkinTime,
          medication_enabled: notificationSettings.medicationEnabled,
          medication_time: notificationSettings.medicationTime,
        });
      }

      // 6. Create doctor connection requests
      for (const doctorEmail of invites.doctors) {
        const { data: doctorId } = await supabase.rpc('get_doctor_id_by_email', { doctor_email: doctorEmail });
        if (doctorId) {
          await supabase.from('patient_doctor_connections').insert({
            patient_id: user.id,
            doctor_id: doctorId,
            initiated_by: 'patient',
            status: 'pending',
          });
        }
      }

      // 7. Create relative connection requests
      for (const relativeEmail of invites.relatives) {
        const { data: relativeId } = await supabase.rpc('get_relative_id_by_email', { relative_email: relativeEmail });
        if (relativeId) {
          await supabase.from('patient_relative_connections').insert({
            patient_id: user.id,
            relative_id: relativeId,
            initiated_by: 'patient',
            status: 'pending',
          });
        }
      }

      toast({
        title: 'Välkommen till Friendly!',
        description: 'Din dagbok är nu redo att använda.',
      });
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara alla inställningar. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalChars = characteristics.elevated.length + characteristics.stable.length + characteristics.depressed.length;

  return (
    <DarkNightBackground>
      {/* Header with progress */}
      <header className="p-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Logo className="[&_span]:!bg-none [&_span]:!text-white" />
            <span className="text-xs text-white/50 font-medium">
              Steg {step} av {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(45_85%_55%)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-3 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Välkommen till Friendly
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Din personliga stämningsdagbok för att förstå och följa ditt mående
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <h2 className="font-semibold text-sm mb-3">Vad du kan göra:</h2>
                <div className="space-y-2.5">
                  {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{feature.title}</h3>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-center mb-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Skapad av och för personer med bipolär sjukdom</span>
                  {' '}i samråd med läkare och experter
                </p>
              </div>

              <Button onClick={handleNext} className="w-full" size="default">
                Kom igång
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Diagnosis */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Dina diagnoser
                </h1>
                <p className="text-sm text-muted-foreground">
                  Lägg till dina diagnoser (valfritt)
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <DiagnosisStep 
                  selectedDiagnoses={selectedDiagnoses}
                  onDiagnosesChange={setSelectedDiagnoses}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default">
                  {getSkipText()}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Choose categories */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Skapa din incheckning
                </h1>
                <p className="text-sm text-muted-foreground">
                  Välj vad du vill ha med i din dagliga incheckning
                </p>
              </div>

              <div className="space-y-2 mb-3">
                {CHECKIN_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = selections[option.id as keyof typeof selections];
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all cursor-pointer",
                        isChecked 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-card hover:border-primary/30'
                      )}
                      onClick={() => handleToggle(option.id)}
                    >
                      <Checkbox
                        id={option.id}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(option.id)}
                        className="pointer-events-none"
                      />
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isChecked ? 'bg-primary/10' : 'bg-muted'
                      )}>
                        <Icon className={cn(
                          "w-4 h-4 transition-colors",
                          isChecked ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={option.id} 
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {option.label}
                          {option.recommended && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              Rekommenderas
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasAnySelection && (
                <p className="text-xs text-destructive text-center mb-2">
                  Välj minst en kategori för att fortsätta
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center mb-3">
                Du kan ändra detta senare i inställningarna
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default" disabled={!hasAnySelection}>
                  Fortsätt
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Medications */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Dina mediciner
                </h1>
                <p className="text-sm text-muted-foreground">
                  Lägg till dina aktuella mediciner (valfritt)
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <MedicationStep 
                  selectedMedications={selectedMedications}
                  onMedicationsChange={setSelectedMedications}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default">
                  {getSkipText()}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Characteristics */}
          {step === 5 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Dina kännetecken
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hur märker du och andra att du mår på ett visst sätt?
                </p>
              </div>

              <div className="glass-card p-4 mb-4 max-h-[50vh] overflow-y-auto">
                <CharacteristicsStep 
                  characteristics={characteristics}
                  onCharacteristicsChange={setCharacteristics}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default">
                  {getSkipText()}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Notifications */}
          {step === 6 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Påminnelser
                </h1>
                <p className="text-sm text-muted-foreground">
                  Få påminnelser för att inte glömma bort att checka in
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <NotificationStep 
                  settings={notificationSettings}
                  onSettingsChange={setNotificationSettings}
                  includeMedication={selections.include_medication}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default">
                  {getSkipText()}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Invite */}
          {step === 7 && (
            <div className="animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Bjud in
                </h1>
                <p className="text-sm text-muted-foreground">
                  Dela din data med läkare eller anhöriga
                </p>
              </div>

              <div className="glass-card p-4 mb-4">
                <InviteStep 
                  invites={invites}
                  onInvitesChange={setInvites}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext} className="flex-1" size="default">
                  {getSkipText()}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 8: Confirm & Start */}
          {step === 8 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                  Allt är redo!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Här är en sammanfattning
                </p>
              </div>

              <div className="space-y-3 mb-4 max-h-[45vh] overflow-y-auto">
                {/* Checkin categories */}
                <div className="glass-card p-3">
                  <h2 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Din incheckning</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {CHECKIN_OPTIONS.filter(opt => selections[opt.id as keyof typeof selections]).map((option) => {
                      const Icon = option.icon;
                      return (
                        <div key={option.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10">
                          <Icon className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium">{option.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Diagnoses */}
                {selectedDiagnoses.length > 0 && (
                  <div className="glass-card p-3">
                    <h2 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Diagnoser</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDiagnoses.map((diagnosis) => (
                        <span key={diagnosis} className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                          {diagnosis}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medications */}
                {selectedMedications.length > 0 && (
                  <div className="glass-card p-3">
                    <h2 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Mediciner</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMedications.map((med) => (
                        <span key={med.name} className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                          {med.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Characteristics */}
                {totalChars > 0 && (
                  <div className="glass-card p-3">
                    <h2 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Kännetecken</h2>
                    <div className="space-y-1.5">
                      {characteristics.elevated.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-600 font-medium w-16">Uppvarvad:</span>
                          <span className="text-xs text-muted-foreground">{characteristics.elevated.join(', ')}</span>
                        </div>
                      )}
                      {characteristics.stable.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 font-medium w-16">Stabil:</span>
                          <span className="text-xs text-muted-foreground">{characteristics.stable.join(', ')}</span>
                        </div>
                      )}
                      {characteristics.depressed.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-red-600 font-medium w-16">Nedstämd:</span>
                          <span className="text-xs text-muted-foreground">{characteristics.depressed.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {(notificationSettings.checkinEnabled || notificationSettings.medicationEnabled) && (
                  <div className="glass-card p-3">
                    <h2 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Påminnelser</h2>
                    <div className="space-y-1">
                      {notificationSettings.checkinEnabled && (
                        <p className="text-xs">Incheckning kl {notificationSettings.checkinTime}</p>
                      )}
                      {notificationSettings.medicationEnabled && (
                        <p className="text-xs">Medicin kl {notificationSettings.medicationTime}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Invites */}
                {(invites.doctors.length > 0 || invites.relatives.length > 0) && (
                  <div className="glass-card p-3">
                    <h2 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Inbjudningar</h2>
                    <div className="space-y-1">
                      {invites.doctors.map(email => (
                        <p key={email} className="text-xs flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" /> {email}
                        </p>
                      ))}
                      {invites.relatives.map(email => (
                        <p key={email} className="text-xs flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> {email}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <h3 className="font-medium text-xs mb-1">Tips:</h3>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Checka in varje dag, gärna vid samma tid</li>
                  <li>• Din data är privat och säker</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} size="default">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Tillbaka
                </Button>
                <Button onClick={handleSubmit} className="flex-1" size="default" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  Starta min dagbok
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DarkNightBackground>
  );
};

export default Onboarding;
