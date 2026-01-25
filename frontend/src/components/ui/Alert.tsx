import * as React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, ...props }, ref) => {
    const variants = {
      info: 'bg-info-bg text-info border-info/20 dark:bg-info/10 dark:text-info dark:border-info/20',
      success:
        'bg-success-bg text-success border-success/20 dark:bg-success/10 dark:text-success dark:border-success/20',
      warning:
        'bg-warning-bg text-yellow-800 border-warning/20 dark:bg-warning/10 dark:text-warning dark:border-warning/20',
      error:
        'bg-error-bg text-error border-error/20 dark:bg-error/10 dark:text-error dark:border-error/20',
    };

    const icons = {
      info: <Info className="h-5 w-5 text-info" />,
      success: <CheckCircle2 className="h-5 w-5 text-success" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-warning" />,
      error: <XCircle className="h-5 w-5 text-error" />,
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 flex gap-3 items-start',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
        <div className="flex-1">
          {title && <h5 className="font-bold leading-none tracking-tight mb-1">{title}</h5>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert };
