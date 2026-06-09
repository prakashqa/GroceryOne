'use client';

import { MessageCircle } from 'lucide-react';

/** GroOne sales/support WhatsApp number shown in the app header. */
export const SUPPORT_WHATSAPP_NUMBER = '9010888871';
/** India country code + number, with a prefilled message. */
export const SUPPORT_WHATSAPP_URL =
  `https://wa.me/91${SUPPORT_WHATSAPP_NUMBER}?text=` +
  encodeURIComponent('Hi GroOne support, I need help with the app.');

/**
 * WhatsApp sales-support contact for the header. On the desktop (Electron) it
 * opens the system browser via the exposed `groone.openExternal` bridge; on the
 * cloud web app it falls back to a normal new-tab link.
 */
export function WhatsappSupport({ className = '' }: { className?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    const bridge = typeof window !== 'undefined' ? (window as any).groone : undefined;
    if (bridge?.openExternal) {
      e.preventDefault();
      bridge.openExternal(SUPPORT_WHATSAPP_URL);
    }
  };

  return (
    <a
      href={SUPPORT_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title="WhatsApp sales support"
      aria-label={`WhatsApp support ${SUPPORT_WHATSAPP_NUMBER}`}
      className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-green-500/10 hover:bg-green-500/15 transition-colors ${className}`}
    >
      <MessageCircle size={16} />
      <span className="hidden sm:inline font-normal text-gray-500 dark:text-gray-400">Support</span>
      <span className="tabular-nums">{SUPPORT_WHATSAPP_NUMBER}</span>
    </a>
  );
}

export default WhatsappSupport;
