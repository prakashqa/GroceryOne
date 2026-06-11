import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: jest.fn() }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, f?: string) => f ?? k, i18n: { language: 'en' } }),
}));
jest.mock('@/hooks/useAppDispatch', () => ({ useAppDispatch: () => jest.fn() }));

import SignupPage from '@/app/(auth)/signup/page';

const OLD = process.env.NEXT_PUBLIC_DESKTOP_BUILD;

function fillBaseForm(container: HTMLElement) {
  const inputs = container.querySelectorAll('input');
  // order: businessName, firstName, lastName, email, phone, password, confirmPassword, pin, confirmPin
  const vals = ['My Shop', 'Asha', 'K', 'a@b.com', '9876543210', 'Password1', 'Password1', '1234', '1234'];
  inputs.forEach((el, i) => fireEvent.change(el, { target: { value: vals[i] } }));
}

function mockOkFetch() {
  const fn = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r', tenantSlug: 'my-shop' } }),
  });
  (global as { fetch?: unknown }).fetch = fn;
  return fn;
}

afterEach(() => {
  delete (window as { groone?: unknown }).groone;
  if (OLD === undefined) delete process.env.NEXT_PUBLIC_DESKTOP_BUILD;
  else process.env.NEXT_PUBLIC_DESKTOP_BUILD = OLD;
  jest.restoreAllMocks();
  delete (global as { fetch?: unknown }).fetch;
  push.mockClear();
});

describe('SignupPage — cloud build', () => {
  it('does not render the license key field and signs up without activation', async () => {
    delete process.env.NEXT_PUBLIC_DESKTOP_BUILD;
    const fetchSpy = mockOkFetch();
    const { container } = render(<SignupPage />);
    expect(screen.queryByTestId('signup-license-key')).not.toBeInTheDocument();
    fillBaseForm(container);
    fireEvent.click(screen.getByText('Create Account'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });
});

describe('SignupPage — desktop build', () => {
  function setupDesktop(activate: jest.Mock) {
    process.env.NEXT_PUBLIC_DESKTOP_BUILD = '1';
    (window as { groone?: unknown }).groone = {
      machineId: () => Promise.resolve({ full: 'a1b2c3d4e5f6deadbeef', short: 'A1B2-C3D4-E5F6' }),
      license: { activate },
    };
  }

  it('shows the Machine ID + key field and blocks signup on a wrong-machine key (no fetch)', async () => {
    const activate = jest.fn().mockResolvedValue({ ok: false, code: 'WRONG_MACHINE', message: 'x' });
    setupDesktop(activate);
    const fetchSpy = mockOkFetch();
    const { container } = render(<SignupPage />);

    expect(await screen.findByText('A1B2-C3D4-E5F6')).toBeInTheDocument();
    fillBaseForm(container);
    fireEvent.change(screen.getByTestId('signup-license-key'), { target: { value: 'BAD.KEY' } });
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => expect(activate).toHaveBeenCalledWith('BAD.KEY'));
    expect(await screen.findByText(/different computer/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('activates a good key first, then signs up', async () => {
    const activate = jest.fn().mockResolvedValue({ ok: true, customer: 'My Shop', expiresAt: '2028-01-01' });
    setupDesktop(activate);
    const fetchSpy = mockOkFetch();
    const { container } = render(<SignupPage />);
    await screen.findByText('A1B2-C3D4-E5F6');
    fillBaseForm(container);
    fireEvent.change(screen.getByTestId('signup-license-key'), { target: { value: 'GOOD.KEY' } });
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => expect(activate).toHaveBeenCalledWith('GOOD.KEY'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });
});
