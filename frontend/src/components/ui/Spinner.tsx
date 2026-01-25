import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent' | 'white';
}

export function Spinner({ className, size = 'md', variant = 'primary' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const variants = {
    primary: 'text-primary',
    secondary: 'text-neutral-500',
    accent: 'text-accent',
    white: 'text-white',
  };

  return <Loader2 className={cn('animate-spin', sizes[size], variants[variant], className)} />;
}
