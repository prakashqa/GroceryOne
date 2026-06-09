import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Consistent empty state using the `.empty-state*` design-system classes.
 * Use in any panel that has nothing to display yet.
 */
export function EmptyState({ icon, title, hint, action, className }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className || ''}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {hint && <p className="empty-state-hint">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
