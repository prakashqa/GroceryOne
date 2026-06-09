import type { ReactNode } from 'react';

interface StatCardProps {
  /** Short metric label, e.g. "Today's Sales". */
  label: string;
  /** Formatted metric value, e.g. "₹12,340" or "18". */
  value: string;
  /** Optional leading icon node (already sized by the caller). */
  icon?: ReactNode;
  /** Extra classes for the icon halo (e.g. a tint colour). */
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
            className={`flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-light ${iconClassName || ''}`}
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
