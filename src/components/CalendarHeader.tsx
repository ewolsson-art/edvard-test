import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CalendarHeaderProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarHeader({ title, onPrev, onNext }: CalendarHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Föregående"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <h3 className="font-display text-xl font-semibold capitalize">
        {title}
      </h3>
      
      <button
        onClick={onNext}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Nästa"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
