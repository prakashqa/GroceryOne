'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectItems, useLazyGetItemByBarcodeQuery } from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { X, CheckCircle2, AlertTriangle, ScanLine, PackagePlus, RotateCcw } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { resolveBarcode } from '@/lib/barcode/resolveBarcode';

interface BarcodeScannerModalProps {
  onClose: () => void;
  /**
   * Called when a scan resolves to an item (local catalog OR backend). The
   * CALLER decides what to do with it — POS adds it to the active cart, item
   * management fills the barcode field. The modal itself dispatches nothing.
   */
  onItemResolved?: (item: DomainTypes.Item) => void;
  /**
   * Called when the user taps "Add this product" on an unrecognised barcode.
   * POS routes to the new-item form prefilled with this code.
   */
  onAddProduct?: (barcode: string) => void;
  /**
   * Capture mode: when provided, a scan returns the RAW decoded code and the
   * modal does NOT resolve it to an item or touch the cart. Item management
   * uses this to fill the barcode field of a product being created.
   */
  onRawScan?: (barcode: string) => void;
  /** Header title override (e.g. "Scan to fill barcode" in item management). */
  title?: string;
}

type ScanState = 'scanning' | 'found' | 'not-found' | 'error';

export function BarcodeScannerModal({ onClose, onItemResolved, onAddProduct, onRawScan, title }: BarcodeScannerModalProps) {
  const { t } = useTranslation('common');
  const allItems = useAppSelector(selectItems);
  const [triggerBarcode] = useLazyGetItemByBarcodeQuery();

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [foundItem, setFoundItem] = useState<DomainTypes.Item | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [cameraError, setCameraError] = useState('');

  const handleScan = useCallback(
    async (barcode: string) => {
      // Only act on a fresh scan; ignore camera frames while showing a result.
      if (scanState !== 'scanning') return;
      const code = barcode.trim();
      if (!code) return;
      setScannedBarcode(code);

      // Capture mode: hand the raw code back (item-management barcode fill) and
      // stop — no catalog resolution, no cart.
      if (onRawScan) {
        onRawScan(code);
        return;
      }

      // Local-first, backend fallback (offline-safe; never throws).
      const res = await resolveBarcode<DomainTypes.Item>({
        barcode: code,
        items: allItems,
        lazyFetch: (b) => triggerBarcode(b).unwrap(),
      });

      if (res.status === 'not-found') {
        setScanState('not-found');
        return;
      }

      const item = res.item;
      setFoundItem(item);
      setScanState('found');
      onItemResolved?.(item);

      // Continuous scanning: reset after a short confirmation so the next
      // item can be scanned without re-opening the modal.
      setTimeout(() => {
        setFoundItem(null);
        setScanState('scanning');
      }, 1800);
    },
    [scanState, allItems, triggerBarcode, onItemResolved, onRawScan],
  );

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error);
    setScanState('error');
  }, []);

  const scanAgain = useCallback(() => {
    setFoundItem(null);
    setScannedBarcode('');
    setScanState('scanning');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg mx-4 shadow-xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">{title || t('scan.barcodeTitle', 'Scan Barcode')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close', 'Close')}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Scanner */}
        <div className="relative">
          {scanState !== 'error' && (
            <BarcodeScanner onScan={handleScan} onError={handleCameraError} />
          )}

          {/* Found overlay */}
          {scanState === 'found' && foundItem && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white p-4 animate-fade-in">
              <CheckCircle2 size={48} className="mb-3" />
              <p className="text-lg font-bold">{foundItem.name}</p>
              <p className="text-sm opacity-90">{t('picking.add', 'Added')} — {foundItem.defaultQuantity} {foundItem.unit}</p>
              {foundItem.price != null && <p className="text-sm mt-1">₹{foundItem.price}/{foundItem.unit}</p>}
            </div>
          )}

          {/* Not-found overlay with Add-product CTA */}
          {scanState === 'not-found' && (
            <div className="absolute inset-0 bg-orange-500/95 flex flex-col items-center justify-center text-white p-5 animate-fade-in">
              <AlertTriangle size={44} className="mb-2" />
              <p className="text-lg font-bold">{t('scan.notFoundTitle', 'Item not found')}</p>
              <p className="text-sm opacity-90 font-mono mb-4">{scannedBarcode}</p>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                {onAddProduct && (
                  <button
                    onClick={() => onAddProduct(scannedBarcode)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white text-orange-700 font-semibold rounded-lg px-4 py-2.5 hover:bg-orange-50 transition-colors"
                  >
                    <PackagePlus size={16} /> {t('scan.addProduct', 'Add this product')}
                  </button>
                )}
                <button
                  onClick={scanAgain}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/20 text-white font-medium rounded-lg px-4 py-2.5 hover:bg-white/30 transition-colors"
                >
                  <RotateCcw size={16} /> {t('scan.scanAgain', 'Scan again')}
                </button>
              </div>
            </div>
          )}

          {/* Camera error */}
          {scanState === 'error' && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <AlertTriangle size={48} className="text-red-400 mb-3" />
              <p className="text-lg font-medium text-center">{cameraError || t('scan.cameraUnavailable', 'Camera not available')}</p>
              <p className="text-sm mt-1 text-center">{t('scan.allowCamera', 'Please allow camera access and try again')}</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-xs text-gray-500 text-center">
            {scanState === 'scanning'
              ? t('scan.barcodeTips', 'Point camera at a barcode — or use a USB scanner')
              : scanState === 'found'
                ? t('picking.add', 'Added') + '!'
                : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
