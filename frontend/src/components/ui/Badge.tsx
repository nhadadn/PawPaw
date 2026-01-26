import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

function Badge({ className, variant = 'default', size = 'md', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-black text-white hover:bg-neutral-800',
    secondary: 'border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
    outline:
      'text-neutral-900 border-neutral-200 hover:bg-neutral-100 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-200',
    destructive: 'border-transparent bg-error text-white hover:bg-error/80',
    success: 'border-transparent bg-success text-white hover:bg-success/80',
    warning: 'border-transparent bg-warning text-black hover:bg-warning/80',
    info: 'border-transparent bg-info text-white hover:bg-info/80',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
