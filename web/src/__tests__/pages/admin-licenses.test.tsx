import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Admin context: RoleGate reads selectUserRole(state) via react-redux.
jest.mock('react-redux', () => ({
  useSelector: (sel: (s: unknown) => unknown) => sel({ auth: { user: { role: 'admin' } } }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: unknown) =>
      typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));

const generateLicense = jest.fn();
jest.mock('@/lib/api/licenses', () => ({
  generateLicense: (...args: unknown[]) => generateLicense(...args),
  LicensesApiError: class LicensesApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import AdminLicensesPage from '@/app/(dashboard)/admin/licenses/page';

describe('AdminLicensesPage — payment gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('disables Generate until a payment reference of at least 6 chars is entered', () => {
    render(<AdminLicensesPage />);
    const submit = screen.getByTestId('lic-submit');
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId('lic-paymentRef'), { target: { value: 'abc' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId('lic-paymentRef'), { target: { value: 'UPI-TXN-425912345678' } });
    expect(submit).toBeEnabled();
  });

  it('asks for human confirmation and aborts the mint when cancelled', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminLicensesPage />);

    fireEvent.change(screen.getByTestId('lic-paymentRef'), { target: { value: 'UPI-TXN-425912345678' } });
    fireEvent.click(screen.getByTestId('lic-submit'));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(generateLicense).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('mints with the trimmed payment reference after confirmation', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    generateLicense.mockResolvedValue({
      id: 'lk-1', key: 'GROD-A2B3-C4D5-E6F7-G8H9', tenantSlug: 'test-store',
      plan: 'desktop_yearly', status: 'pending',
      issuedAt: new Date().toISOString(), expiresAt: new Date().toISOString(),
      paymentRef: 'UPI-TXN-425912345678',
    });
    render(<AdminLicensesPage />);

    fireEvent.change(screen.getByTestId('lic-paymentRef'), { target: { value: '  UPI-TXN-425912345678  ' } });
    fireEvent.click(screen.getByTestId('lic-submit'));

    await waitFor(() => expect(generateLicense).toHaveBeenCalledTimes(1));
    expect(generateLicense).toHaveBeenCalledWith(
      'test-store',
      expect.objectContaining({ paymentRef: 'UPI-TXN-425912345678' }),
    );
    expect(await screen.findByTestId('lic-key')).toHaveTextContent('GROD-A2B3-C4D5-E6F7-G8H9');
    confirmSpy.mockRestore();
  });
});
