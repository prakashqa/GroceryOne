import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = { 'picking.add': 'Add' };
      return map[key] || key;
    },
  }),
}));

import { ProductCard } from '@/components/common/ProductCard';

describe('ProductCard', () => {
  const defaultProps = {
    name: 'Rice',
    price: 45,
    unit: 'kg',
    onAdd: jest.fn(),
    onIncrement: jest.fn(),
    onDecrement: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product name and price', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Rice')).toBeInTheDocument();
    expect(screen.getByText('₹45/kg')).toBeInTheDocument();
  });

  it('shows Add button when not in cart', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('+ Add')).toBeInTheDocument();
  });

  it('calls onAdd when Add button is clicked', () => {
    render(<ProductCard {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add'));
    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('shows quantity controls when in cart', () => {
    render(<ProductCard {...defaultProps} inCartQty={3} />);
    expect(screen.getByText('3 kg')).toBeInTheDocument();
    expect(screen.queryByText('+ Add')).not.toBeInTheDocument();
  });

  it('calls onIncrement and onDecrement', () => {
    render(<ProductCard {...defaultProps} inCartQty={2} />);
    const buttons = screen.getAllByRole('button');
    // First button is decrement, last is increment
    fireEvent.click(buttons[0]); // decrement
    expect(defaultProps.onDecrement).toHaveBeenCalledTimes(1);
    fireEvent.click(buttons[1]); // increment
    expect(defaultProps.onIncrement).toHaveBeenCalledTimes(1);
  });

  it('has hover animation classes', () => {
    const { container } = render(<ProductCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover:shadow-md');
    expect(card.className).toContain('hover:-translate-y-0.5');
  });

  it('applies in-cart styling when item is in cart', () => {
    const { container } = render(<ProductCard {...defaultProps} inCartQty={1} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-in-cart-border');
  });
});
