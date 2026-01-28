import * as React from 'react';
import { cn } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface TimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ expiresAt, onExpire, className }: TimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft(0);
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
        return 0;
      }

      return Math.floor(difference / 1000);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire, isExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 font-mono font-bold text-lg',
        timeLeft < 60 ? 'text-error animate-pulse' : 'text-neutral-900 dark:text-white',
        className
      )}
      role="timer"
      aria-label={`Tiempo restante: ${minutes} minutos y ${seconds} segundos`}
    >
      <Clock className="w-5 h-5" />
      <span>
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
    </div>
  );
}
