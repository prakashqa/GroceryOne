import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
});

describe('Breadcrumbs', () => {
  it('renders all items', () => {
    render(<Breadcrumbs items={[{ label: 'Orders', href: '/orders' }, { label: 'Order 1' }]} />);
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Order 1')).toBeInTheDocument();
  });

  it('renders first item as a link when it has href', () => {
    render(<Breadcrumbs items={[{ label: 'Orders', href: '/orders' }, { label: 'Order 1' }]} />);
    const link = screen.getByText('Orders');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/orders');
  });

  it('renders last item without a link', () => {
    render(<Breadcrumbs items={[{ label: 'Orders', href: '/orders' }, { label: 'Order 1' }]} />);
    const lastItem = screen.getByText('Order 1');
    expect(lastItem.tagName).toBe('SPAN');
  });

  it('has aria-label for accessibility', () => {
    render(<Breadcrumbs items={[{ label: 'Home' }]} />);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });
});
