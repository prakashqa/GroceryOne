import type { ReactNode } from 'react';

type StatTone = 'primary' | 'warning' | 'error' | 'success';

const TONE_HALO: Record<StatTone, string> = {
  primary: 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-light',
  warning: 'bg-warning-bg text-warning dark:bg-warning/15 dark:text-amber-300',
  error: 'bg-error-bg text-error dark:bg-error/15 dark:text-red-300',
  success: 'bg-success-bg text-success dark:bg-success/15 dark:text-green-300',
};

interface StatCardProps {
  /** Short metric label, e.g. "Today's Sales". */
  label: string;
  /** Formatted metric value, e.g. "₹12,340" or "18". */
  value: string;
  /** Optional leading icon node (already sized by the caller). */
  icon?: ReactNode;
  /** Semantic colour for the icon halo (default 'primary'). */
  tone?: StatTone;
  /** Extra classes for the icon halo. */
  iconClassName?: string;
  /** Optional sub-line under the value (counts, deltas, etc.). */
  meta?: ReactNode;
  /** Forwarded to the root element so page-level test ids are preserved. */
  'data-testid'?: string;
  className?: string;
}

/**
 * Metric / KPI tile used across Dashboard and Reports. Wraps the
 * `.stat-card*` design-system classes so every metric tile shares the same
 * elevation, spacing, and typography in both light and dark mode.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'primary',
  iconClassName,
  meta,
  className,
  ...rest
}: StatCardProps) {
  return (
    <div className={`stat-card ${className || ''}`} data-testid={rest['data-testid']}>
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {icon && (
          <span
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${TONE_HALO[tone]} ${iconClassName || ''}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {meta != null && <div className="stat-meta">{meta}</div>}
    </div>
  );
}

export default StatCard;
