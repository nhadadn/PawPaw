import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricsCard({ title, value, icon: Icon, trend, className }: MetricsCardProps) {
  return (
    <div
      className={cn(
        'bg-background-surface overflow-hidden shadow rounded-lg border border-neutral-200 dark:border-neutral-800',
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-text-secondary truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-text-primary">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {trend && (
        <div className="bg-neutral-50 dark:bg-neutral-100 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-sm">
            <span className={cn('font-medium', trend.isPositive ? 'text-success' : 'text-error')}>
              {trend.isPositive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-text-secondary"> vs mes anterior</span>
          </div>
        </div>
      )}
    </div>
  );
}
