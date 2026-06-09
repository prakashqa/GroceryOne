import { render } from '@testing-library/react';
import { Skeleton } from '@/components/common/Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('animate-pulse', 'rounded-lg', 'bg-gray-200');
  });

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="h-8 w-32" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('animate-pulse', 'h-8', 'w-32');
  });

  it('uses the shimmer skeleton (no pulse) when shimmer is set', () => {
    const { container } = render(<Skeleton shimmer />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('skeleton', 'skeleton-shimmer');
    expect(el).not.toHaveClass('animate-pulse');
  });

  it('applies the card variant shape', () => {
    const { container } = render(<Skeleton variant="card" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('skeleton-card');
    expect(el).not.toHaveClass('animate-pulse');
  });
});
