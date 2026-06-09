interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  /** Show the "GroOne" text next to the mark (Sidebar passes false when collapsed). */
  showText?: boolean;
  label?: string;
  className?: string;
}

const MARK_SIZE = { sm: 'w-6 h-6', md: 'w-7 h-7', lg: 'w-10 h-10' } as const;
const ICON_SIZE = { sm: 14, md: 16, lg: 22 } as const;
const TEXT_SIZE = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' } as const;

/**
 * GroOne brand wordmark — an inline-SVG "leaf" mark in a tinted halo plus the
 * gradient wordmark. Inline SVG + CSS only (no public asset) so it renders in
 * the offline desktop build with no network fetch.
 */
export function Wordmark({ size = 'md', showText = true, label = 'GroOne', className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label={label}>
      <span
        data-testid="wordmark-mark"
        aria-hidden="true"
        className={`${MARK_SIZE[size]} rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center text-primary dark:text-primary-light flex-shrink-0`}
      >
        {/* Sprout / leaf glyph in currentColor. */}
        <svg width={ICON_SIZE[size]} height={ICON_SIZE[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21v-7" />
          <path d="M12 14c0-3.5-2.6-6.4-6-7 0 3.5 2.6 6.4 6 7Z" />
          <path d="M12 12c0-3 2.2-5.5 5-6 0 3-2.2 5.5-5 6Z" />
        </svg>
      </span>
      {showText && (
        <span className={`${TEXT_SIZE[size]} font-semibold tracking-tight title-gradient`}>{label}</span>
      )}
    </span>
  );
}

export default Wordmark;
