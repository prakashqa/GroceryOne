import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { licenseGuardAction } from '@/lib/licenseExpiry';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

import SubscriptionExpiredPage from '@/app/(dashboard)/subscription/expired/page';

afterEach(() => { delete (window as { groone?: unknown }).groone; replace.mockClear(); });

describe('licenseGuardAction', () => {
  it('allows a valid license and blocks everything else', () => {
    expect(licenseGuardAction({ state: 'valid' })).toBe('allow');
    expect(licenseGuardAction({ state: 'missing' })).toBe('block');
    expect(licenseGuardAction({ state: 'invalid', code: 'EXPIRED' })).toBe('block');
    expect(licenseGuardAction({ state: 'invalid', code: 'WRONG_MACHINE' })).toBe('block');
  });
});

describe('SubscriptionExpiredPage', () => {
  it('cloud build: shows the static renewal placeholder', () => {
    render(<SubscriptionExpiredPage />);
    expect(screen.getByText('Subscription Expired')).toBeInTheDocument();
    expect(screen.getByText('Renew Subscription')).toBeInTheDocument();
    expect(screen.queryByTestId('renewal-license-key')).not.toBeInTheDocument();
  });

  it('desktop build: shows Machine ID + renewal key; a good key redirects', async () => {
    const activate = jest.fn().mockResolvedValue({ ok: true, customer: 'Shop', expiresAt: '2028-01-01' });
    (window as { groone?: unknown }).groone = {
      machineId: () => Promise.resolve({ full: 'a1b2c3d4e5f6deadbeef', short: 'A1B2-C3D4-E5F6' }),
      license: { activate },
    };
    render(<SubscriptionExpiredPage />);
    expect(await screen.findByText('A1B2-C3D4-E5F6')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('renewal-license-key'), { target: { value: 'GOOD.KEY' } });
    fireEvent.click(screen.getByText(/Renew license/i));
    await waitFor(() => expect(activate).toHaveBeenCalledWith('GOOD.KEY'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/pin-login'));
  });
});
