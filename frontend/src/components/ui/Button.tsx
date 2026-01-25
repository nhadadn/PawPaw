import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-md hover:shadow-lg border border-transparent',
      secondary:
        'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-700 shadow-sm',
      accent:
        'bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-glow hover:shadow-accent/20 border border-transparent',
      outline:
        'bg-transparent border-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800',
      ghost:
        'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
      danger: 'bg-error text-white hover:bg-error/90 shadow-sm border border-transparent',
      success: 'bg-success text-white hover:bg-success/90 shadow-sm border border-transparent',
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm font-medium', // Increased from h-9
      md: 'h-12 px-6 text-base font-semibold', // Increased from h-11
      lg: 'h-14 px-8 text-lg font-bold', // Increased from h-14
      xl: 'h-16 px-10 text-xl font-bold',
      icon: 'h-12 w-12 p-3', // Increased to match md height
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
