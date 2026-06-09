import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  /** Use the premium shimmer sweep instead of the default pulse. */
  shimmer?: boolean;
  /** Preset shape: plain block (default), a text line, or a card. */
  variant?: 'block' | 'text' | 'card';
}

/**
 * Loading placeholder. Default output is unchanged (`animate-pulse rounded-lg
 * bg-gray-200`). Opt into `shimmer` for the travelling-sheen effect, or a
 * `variant` for common shapes.
 */
export function Skeleton({ className, shimmer, variant = 'block' }: SkeletonProps) {
  if (shimmer || variant !== 'block') {
    const variantClass = variant === 'text' ? 'skeleton-text' : variant === 'card' ? 'skeleton-card' : 'skeleton';
    return <div className={cn(variantClass, shimmer && 'skeleton-shimmer', className)} />;
  }
  return (
    <div className={cn('animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700', className)} />
  );
}

export default Skeleton;
