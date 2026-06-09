import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/common/StatCard';
import { cartStatusBadge } from '@/lib/cartStatus';

describe('StatCard', () => {
  it('renders the label and value text', () => {
    render(<StatCard label="Today's Sales" value="₹12,340" />);
    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
    expect(screen.getByText('₹12,340')).toBeInTheDocument();
  });

  it('renders meta when provided and omits it otherwise', () => {
    const { rerender } = render(<StatCard label="Orders" value="18" meta="3 paid" />);
    expect(screen.getByText('3 paid')).toBeInTheDocument();

    rerender(<StatCard label="Orders" value="18" />);
    expect(screen.queryByText('3 paid')).not.toBeInTheDocument();
  });

  it('forwards data-testid to the root element', () => {
    render(<StatCard label="Revenue" value="₹0" data-testid="metric-revenue" />);
    expect(screen.getByTestId('metric-revenue')).toBeInTheDocument();
  });

  it('renders the icon node when provided', () => {
    render(<StatCard label="Items" value="42" icon={<span data-testid="stat-icon" />} />);
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });
});

describe('cartStatusBadge', () => {
  it('maps known statuses to their badge classes', () => {
    expect(cartStatusBadge('paid')).toBe('badge-success');
    expect(cartStatusBadge('printed')).toBe('badge-info');
    expect(cartStatusBadge('completed')).toBe('badge-primary');
    expect(cartStatusBadge('draft')).toBe('badge-neutral');
  });

  it('falls back to neutral for unknown or missing status', () => {
    expect(cartStatusBadge('something-else')).toBe('badge-neutral');
    expect(cartStatusBadge(undefined)).toBe('badge-neutral');
    expect(cartStatusBadge(null)).toBe('badge-neutral');
  });
});
