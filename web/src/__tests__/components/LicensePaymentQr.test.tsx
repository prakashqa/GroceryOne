import { render, screen } from '@testing-library/react';
import { LicensePaymentQr } from '@/components/payment/LicensePaymentQr';

describe('LicensePaymentQr', () => {
  it('shows a configuration hint when no UPI id is set', () => {
    render(<LicensePaymentQr amount={2000} />);
    expect(screen.getByText(/UPI collection ID not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_GROONE_LICENSE_UPI_ID/)).toBeInTheDocument();
  });

  it('renders a QR, the VPA, and the formatted amount when configured', () => {
    render(<LicensePaymentQr upiId="groone@hdfcbank" payeeName="GroOne" amount={2000} note="GroOne license test2-business" />);
    // The VPA is shown to staff/customer.
    expect(screen.getByText('groone@hdfcbank')).toBeInTheDocument();
    // Amount formatted with Indian grouping.
    expect(screen.getByText(/Pay ₹2,000 by UPI/)).toBeInTheDocument();
    // A QR svg is rendered inside the QR container.
    const qr = screen.getByTestId('license-upi-qr');
    expect(qr.querySelector('svg')).toBeInTheDocument();
  });
});
