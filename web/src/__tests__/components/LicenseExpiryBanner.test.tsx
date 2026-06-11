import { render, screen, waitFor } from '@testing-library/react';
import { licenseWarning } from '@/lib/licenseExpiry';
import { LicenseExpiryBanner } from '@/components/common/LicenseExpiryBanner';

const DAY = 86_400_000;
const NOW = Date.parse('2027-06-01T00:00:00Z');

describe('licenseWarning', () => {
  it('does not warn when expiry is comfortably far away', () => {
    const w = licenseWarning(new Date(NOW + 100 * DAY).toISOString(), NOW);
    expect(w.show).toBe(false);
    expect(w.expired).toBe(false);
  });

  it('warns within the 14-day window with the right day count', () => {
    const w = licenseWarning(new Date(NOW + 5 * DAY).toISOString(), NOW);
    expect(w.show).toBe(true);
    expect(w.expired).toBe(false);
    expect(w.days).toBe(5);
  });

  it('flags an expired license', () => {
    const w = licenseWarning(new Date(NOW - 2 * DAY).toISOString(), NOW);
    expect(w.show).toBe(true);
    expect(w.expired).toBe(true);
  });

  it('returns no-show for an unparseable date', () => {
    expect(licenseWarning('not-a-date', NOW).show).toBe(false);
  });
});

describe('LicenseExpiryBanner', () => {
  afterEach(() => { delete (window as any).groone; });

  it('renders nothing on the cloud build (no desktop bridge)', () => {
    const { container } = render(<LicenseExpiryBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a renewal warning when the desktop license expires soon', async () => {
    (window as any).groone = {
      license: {
        info: () => Promise.resolve({
          customer: 'Test2', plan: 'desktop_yearly',
          expiresAt: new Date(Date.now() + 7 * DAY).toISOString(),
        }),
      },
    };
    render(<LicenseExpiryBanner />);
    expect(await screen.findByText(/license expires in 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/9010888871/)).toBeInTheDocument();
  });

  it('stays hidden when the license is not near expiry', async () => {
    (window as any).groone = {
      license: {
        info: () => Promise.resolve({
          customer: 'Test2', plan: 'desktop_yearly',
          expiresAt: new Date(Date.now() + 300 * DAY).toISOString(),
        }),
      },
    };
    const { container } = render(<LicenseExpiryBanner />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
