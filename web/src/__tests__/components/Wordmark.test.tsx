import { render, screen } from '@testing-library/react';
import { Wordmark } from '@/components/common/Wordmark';

describe('Wordmark', () => {
  it('renders the GroOne text and an accessible name', () => {
    render(<Wordmark />);
    expect(screen.getByText('GroOne')).toBeInTheDocument();
    expect(screen.getByLabelText('GroOne')).toBeInTheDocument();
    expect(screen.getByTestId('wordmark-mark')).toBeInTheDocument();
  });

  it('hides the text but keeps the mark when showText is false (collapsed sidebar)', () => {
    render(<Wordmark showText={false} />);
    expect(screen.queryByText('GroOne')).not.toBeInTheDocument();
    expect(screen.getByTestId('wordmark-mark')).toBeInTheDocument();
    // Still exposes an accessible name for the brand.
    expect(screen.getByLabelText('GroOne')).toBeInTheDocument();
  });

  it('honors a custom label', () => {
    render(<Wordmark label="GroOne POS" />);
    expect(screen.getByText('GroOne POS')).toBeInTheDocument();
  });
});
