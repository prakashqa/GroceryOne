'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectItems, selectActiveCart, selectActiveCartItemCount, selectActiveCartGrandTotal,
  addItemToActiveCart, createCart, useLazyGetItemByBarcodeQuery,
} from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { ScanLine, ShoppingCart, CheckCircle2, AlertTriangle, PackagePlus, X, Camera, CornerDownLeft } from 'lucide-react';
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { resolveBarcode } from '@/lib/barcode/resolveBarcode';

/**
 * Dedicated barcode-scanning till. USB/Bluetooth keyboard-wedge scanners work
 * the instant the page is open (just scan — no clicks). A webcam can be turned
 * on for devices without a hardware scanner. Each scan resolves local→backend
 * and drops the item into the active cart; unknown codes offer a one-tap "Add
 * product" that pre-fills the new-item form.
 *
 * This is the discoverable home for barcode scanning — distinct from "Scan
 * Order" (paper-order photo OCR).
 */
export default function ScanBarcodePage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const allItems = useAppSelector(selectItems);
  const activeCart = useAppSelector(selectActiveCart);
  const cartItemCount = useAppSelector(selectActiveCartItemCount);
  const grandTotal = useAppSelector(selectActiveCartGrandTotal);
  const [triggerBarcode] = useLazyGetItemByBarcodeQuery();

  const [useCamera, setUseCamera] = useState(false);
  const [recent, setRecent] = useState<{ id: string; name: string; unit: string; qty: number }[]>([]);
  const [missing, setMissing] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const manualRef = useRef<HTMLInputElement>(null);

  // Keep the manual box focused so any scanner — USB, Bluetooth hardware, or a
  // phone HID app (whatever the typing speed) — lands its keystrokes here and
  // submits on Enter. This path is timing-agnostic, unlike the global wedge.
  useEffect(() => {
    manualRef.current?.focus();
  }, []);

  const addToCart = useCallback((item: DomainTypes.Item) => {
    if (!activeCart || activeCart.status === 'paid') {
      const name = `Order ${new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
      dispatch(createCart({ name }));
    }
    dispatch(addItemToActiveCart({ item, quantity: item.defaultQuantity }));
  }, [dispatch, activeCart]);

  const goAddProduct = useCallback((barcode: string) => {
    setMissing(null);
    router.push(`/management/items?barcode=${encodeURIComponent(barcode)}`);
  }, [router]);

  const handleScannedCode = useCallback(async (code: string) => {
    setMissing(null);
    const res = await resolveBarcode<DomainTypes.Item>({
      barcode: code,
      items: allItems,
      lazyFetch: (b) => triggerBarcode(b).unwrap(),
    });
    if (res.status === 'not-found') {
      setMissing(code.trim());
      return;
    }
    addToCart(res.item);
    setRecent((prev) => [
      { id: res.item.id, name: res.item.name, unit: res.item.unit, qty: res.item.defaultQuantity },
      ...prev,
    ].slice(0, 12));
  }, [allItems, triggerBarcode, addToCart]);

  // Manual / focused-box entry — works at ANY keystroke speed (hand-typed, or
  // a slow/erratic Bluetooth phone scanner). Submits the whole value on Enter.
  const submitManual = useCallback(async () => {
    const code = manualCode.trim();
    if (!code) return;
    setManualCode('');
    await handleScannedCode(code);
    manualRef.current?.focus();
  }, [manualCode, handleScannedCode]);

  // USB/Bluetooth keyboard-wedge: a fallback for when focus isn't in the box
  // (e.g. the user clicked elsewhere). The focused box above handles the
  // common case and isn't speed-dependent.
  useBarcodeScanner({ onScan: handleScannedCode });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ScanLine size={22} className="text-primary" /> {t('scan.barcodeTitle', 'Scan Barcode')}
          </h1>
          <p className="page-subtitle">
            {t('scan.barcodePageHint', 'Scan with a USB/Bluetooth scanner, or turn on the camera. Items are added to the current order.')}
          </p>
        </div>
        <button
          onClick={() => { setCameraError(null); setUseCamera((v) => !v); }}
          className="btn-secondary"
        >
          <Camera size={16} /> {useCamera ? t('scan.stopCamera', 'Stop camera') : t('scan.useCamera', 'Use camera')}
        </button>
      </div>

      {/* Always-on manual / focused-box entry — timing-agnostic. Works with a
          hand-typed code or any phone/Bluetooth scanner that "types" the code,
          however slowly. Submits on Enter. */}
      <div className="card p-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="search-wrap flex-1">
            <ScanLine size={18} />
            <input
              ref={manualRef}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submitManual(); } }}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('scan.manualPlaceholder', 'Scan or type a barcode, then press Enter')}
              aria-label={t('scan.manualPlaceholder', 'Scan or type a barcode, then press Enter')}
              className="search-input font-mono"
            />
          </div>
          <button onClick={() => void submitManual()} disabled={!manualCode.trim()} className="btn-primary">
            <CornerDownLeft size={16} /> {t('scan.addCode', 'Add')}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Scan surface */}
        <div className="card overflow-hidden">
          {useCamera && !cameraError ? (
            <BarcodeScanner onScan={handleScannedCode} onError={(e) => setCameraError(e)} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 min-h-[260px]">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-4">
                <ScanLine size={30} className="text-primary" strokeWidth={1.6} />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('scan.readyTitle', 'Ready to scan')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                {cameraError
                  ? cameraError
                  : t('scan.readyHint', 'Point your USB/Bluetooth scanner at a barcode — the item is added automatically. No need to click anything.')}
              </p>
            </div>
          )}

          {missing && (
            <div className="border-t border-line dark:border-line-dark p-4 bg-warning-bg dark:bg-warning/10">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle size={18} />
                <span className="font-medium">{t('scan.notFoundTitle', 'Item not found')}</span>
                <span className="font-mono text-sm">{missing}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => goAddProduct(missing)} className="btn-primary btn-sm">
                  <PackagePlus size={14} /> {t('scan.addProduct', 'Add this product')}
                </button>
                <button onClick={() => setMissing(null)} className="btn-ghost btn-sm" aria-label={t('close', 'Close')}>
                  <X size={14} /> {t('cancel', 'Dismiss')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recently scanned + order summary */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-line-dark">
            <h2 className="font-semibold">{t('scan.recentlyScanned', 'Recently scanned')}</h2>
            {cartItemCount > 0 && (
              <span className="badge-info">{cartItemCount} {t('picking.items', 'items')}</span>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 min-h-[200px]">
              <ScanLine size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm">{t('scan.nothingYet', 'Scanned items will appear here')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-line dark:divide-line-dark flex-1 overflow-y-auto">
              {recent.map((r, i) => (
                <li key={`${r.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5 animate-fade-in">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  <span className="flex-1 font-medium text-gray-900 dark:text-gray-100 truncate">{r.name}</span>
                  <span className="text-sm text-gray-500">+{r.qty} {r.unit}</span>
                </li>
              ))}
            </ul>
          )}

          {cartItemCount > 0 && activeCart && (
            <div className="border-t border-line dark:border-line-dark px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                <span className="font-semibold">₹{grandTotal.toFixed(2)}</span>
              </div>
              <Link href={`/orders/${activeCart.id}`} className="btn-primary btn-sm">
                {t('picking.viewCart', 'View order')} &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
