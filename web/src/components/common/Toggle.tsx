'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  /** Accessible name for the switch. */
  label?: string;
  id?: string;
  testId?: string;
}

/**
 * Accessible on/off switch. Replaces the inline toggles that were duplicated
 * across the Settings screens. Renders as `role="switch"` with `aria-checked`.
 */
export function Toggle({ checked, onChange, disabled, label, id, testId }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      data-testid={testId}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => { if (!disabled) onChange(!checked); }}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default Toggle;
