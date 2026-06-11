import { render, screen, fireEvent } from '@testing-library/react';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string, f?: string) => f ?? k }) }));

import SubscriptionPlanPage from '@/app/(auth)/subscription-plan/page';

afterEach(() => push.mockClear());

describe('SubscriptionPlanPage', () => {
  it('shows a single Yearly ₹2,999 plan', () => {
    render(<SubscriptionPlanPage />);
    expect(screen.getByText('₹2,999')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('removes the monthly plan, Save 25%, the 14-day trial text and the Skip option', () => {
    render(<SubscriptionPlanPage />);
    expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
    expect(screen.queryByText('₹499')).not.toBeInTheDocument();
    expect(screen.queryByText('Save 25%')).not.toBeInTheDocument();
    expect(screen.queryByText(/14-day/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Skip/i)).not.toBeInTheDocument();
  });

  it('Continue proceeds to pin-setup', () => {
    render(<SubscriptionPlanPage />);
    fireEvent.click(screen.getByText('Continue'));
    expect(push).toHaveBeenCalledWith('/pin-setup');
  });
});
