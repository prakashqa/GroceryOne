import type { ReactNode } from 'react';

interface SettingRowProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  /** Right-side control (Toggle, value text, chevron, etc.). */
  control?: ReactNode;
  /** When provided the row becomes a button. */
  onClick?: () => void;
}

/**
 * A settings list row: icon + label + description + right-side control.
 * Uses the `.row` design-system class. Becomes a button when `onClick` is set.
 */
export function SettingRow({ icon, label, description, control, onClick }: SettingRowProps) {
  const inner = (
    <>
      {icon && (
        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center text-gray-600 dark:text-gray-300">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      {control}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="row w-full text-left">
        {inner}
      </button>
    );
  }
  return <div className="row">{inner}</div>;
}

export default SettingRow;
