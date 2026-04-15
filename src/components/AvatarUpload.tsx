import { useState, useRef } from 'react';
import { Camera, Loader2, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  firstName,
  lastName,
  className,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Fel filtyp',
        description: 'Välj en bild (JPG, PNG, GIF, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Filen är för stor',
        description: 'Max filstorlek är 5 MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: avatarUrl,
        }, {
          onConflict: 'user_id',
        });

      if (updateError) throw updateError;

      onAvatarChange(avatarUrl);
      toast({
        title: 'Profilbild uppladdad!',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Kunde inte ladda upp',
        description: 'Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!user || !currentAvatarUrl) return;

    setIsRemoving(true);

    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.gif`, `${user.id}/avatar.webp`]);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onAvatarChange(null);
      toast({
        title: 'Profilbild borttagen',
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: 'Kunde inte ta bort',
        description: 'Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const isLoading = isUploading || isRemoving;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative group">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={currentAvatarUrl || undefined} alt="Profilbild" />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {initials || <User className="w-10 h-10" />}
          </AvatarFallback>
        </Avatar>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {currentAvatarUrl ? 'Byt bild' : 'Ladda upp'}
        </Button>

        {currentAvatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-2" />
            Ta bort
          </Button>
        )}
      </div>
    </div>
  );
}
