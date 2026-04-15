import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

export const ChangePasswordSection = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordSchema = z.object({
      newPassword: z.string().min(6, { message: t('settings.passwordMinLength') }),
      confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: t('settings.passwordsMismatch'),
      path: ["confirmPassword"],
    });

    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'newPassword') fieldErrors.newPassword = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsChanging(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: t('settings.couldNotChangePassword'), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t('settings.passwordChanged'), description: t('settings.passwordChangedDesc') });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast({ title: t('common.somethingWrong'), description: t('common.tryAgainLater'), variant: "destructive" });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">{t('settings.changePasswordHeading')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.changePasswordDesc')}</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('settings.newPasswordLabel')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="newPassword" type={showNewPassword ? "text" : "password"} placeholder={t('settings.newPasswordPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10" disabled={isChanging} />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('settings.confirmNewPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={t('settings.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10" disabled={isChanging} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" disabled={isChanging || !newPassword || !confirmPassword} className="gap-2">
          {isChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {t('settings.changePasswordBtn')}
        </Button>
      </form>
    </div>
  );
};
