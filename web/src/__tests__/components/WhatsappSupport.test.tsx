import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsappSupport, SUPPORT_WHATSAPP_URL } from '@/components/common/WhatsappSupport';

describe('WhatsappSupport', () => {
  afterEach(() => { delete (window as any).groone; });

  it('shows the support number', () => {
    render(<WhatsappSupport />);
    expect(screen.getByText('9010888871')).toBeInTheDocument();
  });

  it('links to the WhatsApp chat for +91 9010888871', () => {
    render(<WhatsappSupport />);
    const link = screen.getByRole('link', { name: /WhatsApp support 9010888871/i });
    expect(link.getAttribute('href')).toContain('wa.me/919010888871');
    expect(SUPPORT_WHATSAPP_URL).toContain('wa.me/919010888871');
  });

  it('opens via the desktop bridge when available (no in-app navigation)', () => {
    const openExternal = jest.fn();
    (window as any).groone = { openExternal };
    render(<WhatsappSupport />);
    fireEvent.click(screen.getByRole('link', { name: /WhatsApp support/i }));
    expect(openExternal).toHaveBeenCalledWith(SUPPORT_WHATSAPP_URL);
  });
});
