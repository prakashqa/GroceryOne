'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectPrinter,
  setPrinterEnabled,
  setAutoPrint,
  setPaperSize,
  setPrintFormat,
  setPrinterConnectionType,
  setSelectedPrinter,
  setImageWidthDots,
  setAutoCut,
  setCutMode,
  PrinterConnectionType,
  CutMode,
} from '@groceryone/store';
import { ArrowLeft, Bluetooth, Info } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Toggle } from '@/components/common/Toggle';
import { Segmented } from '@/components/common/Segmented';
import { SettingRow } from '@/components/common/SettingRow';

export default function PrinterSettingsPage() {
  const dispatch = useAppDispatch();
  const printer = useAppSelector(selectPrinter);
  const { t } = useTranslation('profile');

  // Local controlled inputs for the name/address manual-entry fields.
  // Web cannot scan Bluetooth devices, so the user may paste values from
  // the mobile app (or leave them as-is when mobile has already populated
  // the shared slice via backend-sync — not in scope for this change).
  const [deviceName, setDeviceName] = useState(printer.selectedPrinterName ?? '');
  const [deviceAddress, setDeviceAddress] = useState(printer.selectedPrinterAddress ?? '');

  // Keep local inputs in sync if another tab (or future backend sync)
  // updates the persisted printer settings.
  useEffect(() => {
    setDeviceName(printer.selectedPrinterName ?? '');
    setDeviceAddress(printer.selectedPrinterAddress ?? '');
  }, [printer.selectedPrinterName, printer.selectedPrinterAddress]);

  const commitSelectedPrinter = () => {
    const name = deviceName.trim();
    const address = deviceAddress.trim();
    if (!name && !address) {
      dispatch(setSelectedPrinter(null));
      return;
    }
    dispatch(
      setSelectedPrinter({
        id: printer.selectedPrinterId ?? `manual-${Date.now()}`,
        name,
        address,
      }),
    );
  };

  const connectionTypeOptions: { value: PrinterConnectionType; label: string }[] = [
    { value: 'none', label: t('settings.printer.none', 'None') },
    { value: 'bluetooth', label: t('settings.printer.bluetooth', 'Bluetooth') },
    { value: 'network', label: t('settings.printer.network', 'Network') },
    { value: 'usb', label: t('settings.printer.usb', 'USB') },
  ];

  const cutModeOptions: { value: CutMode; label: string }[] = [
    { value: 'full', label: t('settings.printer.cutModeFull', 'Full') },
    { value: 'partial', label: t('settings.printer.cutModePartial', 'Partial') },
  ];

  const statusColor: Record<string, string> = {
    connected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    connecting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    disconnected: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="page page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="btn-icon" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">{t('settings.printer.title')}</h1>
      </div>

      <div className="space-y-4">
        {/* Enable + auto-print */}
        <div className="card row-divider">
          <SettingRow
            label={t('settings.printer.enabled')}
            description={t('settings.printer.enabledDescription')}
            control={<Toggle checked={printer.enabled} label={t('settings.printer.enabled')} testId="printer-enabled-toggle" onChange={(v) => dispatch(setPrinterEnabled(v))} />}
          />
          <SettingRow
            label={t('settings.printer.autoPrint')}
            description={t('settings.printer.autoPrintDescription')}
            control={<Toggle checked={printer.autoPrint} label={t('settings.printer.autoPrint')} testId="auto-print-toggle" onChange={(v) => dispatch(setAutoPrint(v))} />}
          />
        </div>

        {/* Bluetooth & Device card */}
        <div className="card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Bluetooth size={18} className="text-primary dark:text-primary-light" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.printer.bluetoothSection', 'Bluetooth & Device')}
            </p>
          </div>

          {/* Mobile-only banner */}
          <div className="flex gap-2 items-start px-3 py-2.5 rounded-lg bg-info-bg dark:bg-info/15 text-info dark:text-blue-200 text-xs">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              {t(
                'settings.printer.bluetoothBanner',
                'Bluetooth scanning and pairing happen in the GroOne mobile app. Values below reflect the persisted printer configuration; manual edits here are saved to this browser.',
              )}
            </p>
          </div>

          {/* Connection Type */}
          <div>
            <label className="label">{t('settings.printer.connectionType', 'Connection Type')}</label>
            <Segmented<PrinterConnectionType>
              options={connectionTypeOptions}
              value={printer.connectionType}
              onChange={(v) => dispatch(setPrinterConnectionType(v))}
            />
          </div>

          {/* Selected printer */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="printer-device-name" className="label">{t('settings.printer.deviceName', 'Printer Name')}</label>
              <input
                id="printer-device-name"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                onBlur={commitSelectedPrinter}
                placeholder={t('settings.printer.deviceNamePlaceholder', 'e.g. POS-80 Printer')}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="printer-device-address" className="label">{t('settings.printer.deviceAddress', 'Printer Address (MAC / IP)')}</label>
              <input
                id="printer-device-address"
                type="text"
                value={deviceAddress}
                onChange={(e) => setDeviceAddress(e.target.value)}
                onBlur={commitSelectedPrinter}
                placeholder="00:11:22:33:44:55"
                className="input font-mono"
              />
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('settings.printer.status', 'Status')}:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                statusColor[printer.connectionStatus] ?? statusColor.disconnected
              }`}
            >
              {t(`settings.printer.status_${printer.connectionStatus}`, printer.connectionStatus)}
            </span>
          </div>

          {/* Image width / DPI */}
          <div>
            <label className="label">{t('settings.printer.imageWidth', 'Image Width (DPI)')}</label>
            <Segmented<number>
              options={[
                { value: 576, label: t('settings.printer.imageWidth576', '576 — Standard 203 DPI') },
                { value: 832, label: t('settings.printer.imageWidth832', '832 — HD 300 DPI') },
              ]}
              value={printer.imageWidthDots ?? 576}
              onChange={(v) => dispatch(setImageWidthDots(v))}
            />
          </div>

          {/* Auto Cut */}
          <SettingRow
            label={t('settings.printer.autoCut', 'Auto Cut')}
            description={t('settings.printer.autoCutDescription', 'Send a cut command to the printer after each print')}
            control={<Toggle checked={printer.autoCut ?? true} label={t('settings.printer.autoCut', 'Auto Cut')} testId="auto-cut-toggle" onChange={(v) => dispatch(setAutoCut(v))} />}
          />

          {/* Cut Mode — disabled when Auto Cut is off */}
          <div>
            <label className="label">{t('settings.printer.cutMode', 'Cut Mode')}</label>
            <Segmented<CutMode>
              options={cutModeOptions}
              value={printer.cutMode ?? 'full'}
              onChange={(v) => dispatch(setCutMode(v))}
              disabled={printer.autoCut === false}
            />
          </div>
        </div>

        {/* Paper size */}
        <div className="card p-5">
          <p className="label">{t('settings.printer.paperSize')}</p>
          <Segmented<'80mm' | '58mm'>
            options={[
              { value: '80mm', label: '80mm' },
              { value: '58mm', label: '58mm' },
            ]}
            value={printer.paperSize}
            onChange={(v) => dispatch(setPaperSize(v))}
          />
        </div>

        {/* Print format */}
        <div className="card p-5">
          <p className="label">{t('settings.printer.printFormat')}</p>
          <Segmented<'receipt' | 'detailed' | 'compact'>
            options={(['receipt', 'detailed', 'compact'] as const).map((fmt) => ({
              value: fmt,
              label: t(`settings.printer.format${fmt}`),
            }))}
            value={printer.printFormat}
            onChange={(v) => dispatch(setPrintFormat(v))}
          />
        </div>
      </div>
    </div>
  );
}
