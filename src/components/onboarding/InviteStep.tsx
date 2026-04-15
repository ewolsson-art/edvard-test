import { useState } from 'react';
import { UserPlus, Stethoscope, Users, X, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface InviteInput {
  doctors: string[];
  relatives: string[];
}

interface InviteStepProps {
  invites: InviteInput;
  onInvitesChange: (invites: InviteInput) => void;
}

export const InviteStep = ({ invites, onInvitesChange }: InviteStepProps) => {
  const [doctorEmail, setDoctorEmail] = useState('');
  const [relativeEmail, setRelativeEmail] = useState('');

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddDoctor = () => {
  const { t } = useTranslation();
    if (!isValidEmail(doctorEmail)) return;
    if (invites.doctors.includes(doctorEmail.toLowerCase())) return;
    
    onInvitesChange({
      ...invites,
      doctors: [...invites.doctors, doctorEmail.toLowerCase()],
    });
    setDoctorEmail('');
  };

  const handleAddRelative = () => {
    if (!isValidEmail(relativeEmail)) return;
    if (invites.relatives.includes(relativeEmail.toLowerCase())) return;
    
    onInvitesChange({
      ...invites,
      relatives: [...invites.relatives, relativeEmail.toLowerCase()],
    });
    setRelativeEmail('');
  };

  const handleRemoveDoctor = (email: string) => {
    onInvitesChange({
      ...invites,
      doctors: invites.doctors.filter(d => d !== email),
    });
  };

  const handleRemoveRelative = (email: string) => {
    onInvitesChange({
      ...invites,
      relatives: invites.relatives.filter(r => r !== email),
    });
  };

  const handleKeyDown = (type: 'doctor' | 'relative', e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      type === 'doctor' ? handleAddDoctor() : handleAddRelative();
    }
  };

  const totalInvites = invites.doctors.length + invites.relatives.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-primary" />
        <span className="text-xs text-muted-foreground">
          Dela din data med vårdgivare eller anhöriga
        </span>
      </div>

      {/* Invite doctor */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Bjud in läkare</span>
        </div>

        {invites.doctors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {invites.doctors.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="pl-2 pr-1 py-1 text-xs flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                {email}
                <button
                  onClick={() => handleRemoveDoctor(email)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="email"
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            onKeyDown={(e) => handleKeyDown('doctor', e)}
            placeholder="lakare@exempel.se"
            className="h-8 text-xs flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddDoctor}
            disabled={!isValidEmail(doctorEmail)}
            className="h-8 text-xs"
          >
            Lägg till
          </Button>
        </div>
      </div>

      {/* Invite relative */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Bjud in anhörig</span>
        </div>

        {invites.relatives.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {invites.relatives.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="pl-2 pr-1 py-1 text-xs flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                {email}
                <button
                  onClick={() => handleRemoveRelative(email)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="email"
            value={relativeEmail}
            onChange={(e) => setRelativeEmail(e.target.value)}
            onKeyDown={(e) => handleKeyDown('relative', e)}
            placeholder="anhörig@exempel.se"
            className="h-8 text-xs flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddRelative}
            disabled={!isValidEmail(relativeEmail)}
            className="h-8 text-xs"
          >
            Lägg till
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {totalInvites === 0 
          ? 'Du kan hoppa över detta och bjuda in personer senare'
          : 'Inbjudningar skickas när du slutfört onboarding'
        }
      </p>
    </div>
  );
};
