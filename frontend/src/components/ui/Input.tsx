import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-neutral-700 dark:text-neutral-300 block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-12 w-full rounded-lg border-2 border-neutral-500 bg-white px-4 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-white',
              error
                ? 'border-error focus-visible:ring-error'
                : 'focus:border-black dark:focus:border-white',
              icon ? 'pl-11' : '',
              className
            )}
            ref={ref}
            {...props}
          />
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-error font-medium animate-slide-up">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
