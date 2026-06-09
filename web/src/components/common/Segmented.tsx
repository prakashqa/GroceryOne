'use client';

import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Generic segmented control (a pill-style option group). Replaces the bespoke
 * segmented buttons in Settings (printer cut mode, paper size, format, etc.).
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] ${className || ''}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => { if (!disabled) onChange(opt.value); }}
            className={`${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'} rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? 'bg-white dark:bg-card-dark text-primary dark:text-primary-light shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
