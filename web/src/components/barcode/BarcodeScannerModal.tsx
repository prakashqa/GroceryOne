'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectItems, selectActiveCart,
  addItemToActiveCart, createCart,
} from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { X, CheckCircle2, AlertTriangle, ScanLine, Loader2 } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface BarcodeScannerModalProps {
  onClose: () => void;
}

type ScanState = 'scanning' | 'found' | 'not-found' | 'error';

export function BarcodeScannerModal({ onClose }: BarcodeScannerModalProps) {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const allItems = useAppSelector(selectItems);
  const activeCart = useAppSelector(selectActiveCart);

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [foundItem, setFoundItem] = useState<DomainTypes.Item | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [cameraError, setCameraError] = useState('');

  const handleScan = useCallback((barcode: string) => {
    if (scanState !== 'scanning') return;

    setScannedBarcode(barcode);

    // Offline-first: look up in local Redux store
    const item = allItems.find((i) => i.barcode === barcode);

    if (item) {
      setFoundItem(item);
      setScanState('found');

      // Auto-add to cart
      if (!activeCart || activeCart.status === 'paid') {
        const name = `Order ${new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
        dispatch(createCart({ name }));
      }
      dispatch(addItemToActiveCart({ item, quantity: item.defaultQuantity }));

      // Auto-reset after 2 seconds to scan next item
      setTimeout(() => {
        setFoundItem(null);
        setScanState('scanning');
      }, 2000);
    } else {
      setScanState('not-found');
      setTimeout(() => setScanState('scanning'), 2500);
    }
  }, [scanState, allItems, activeCart, dispatch]);

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error);
    setScanState('error');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg mx-4 shadow-xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">{t('scan.title', 'Scan Barcode')}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Scanner */}
        <div className="relative">
          {scanState !== 'error' && (
            <BarcodeScanner onScan={handleScan} onError={handleCameraError} />
          )}

          {/* Overlay states */}
          {scanState === 'found' && foundItem && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white p-4 animate-fade-in">
              <CheckCircle2 size={48} className="mb-3" />
              <p className="text-lg font-bold">{foundItem.name}</p>
              <p className="text-sm opacity-90">{t('picking.add', 'Added')} — {foundItem.defaultQuantity} {foundItem.unit}</p>
              {foundItem.price && <p className="text-sm mt-1">₹{foundItem.price}/{foundItem.unit}</p>}
            </div>
          )}

          {scanState === 'not-found' && (
            <div className="absolute inset-0 bg-orange-500/90 flex flex-col items-center justify-center text-white p-4 animate-fade-in">
              <AlertTriangle size={48} className="mb-3" />
              <p className="text-lg font-bold">{t('picking.noItemsFound', 'Item not found')}</p>
              <p className="text-sm opacity-90 font-mono">{scannedBarcode}</p>
            </div>
          )}

          {scanState === 'error' && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <AlertTriangle size={48} className="text-red-400 mb-3" />
              <p className="text-lg font-medium text-center">{cameraError || 'Camera not available'}</p>
              <p className="text-sm mt-1 text-center">Please allow camera access and try again</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-xs text-gray-500 text-center">
            {scanState === 'scanning' ? t('scan.tips', 'Point camera at a barcode') : scanState === 'found' ? t('picking.add', 'Added to cart') + '!' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
