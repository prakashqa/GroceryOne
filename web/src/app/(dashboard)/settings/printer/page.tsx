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

  const Toggle = ({
    checked,
    onChange,
    disabled,
    testId,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    testId?: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={`w-11 h-6 rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  // Reusable segmented control for { value, label } sets.
  function Segmented<T extends string | number>({
    options,
    value,
    onChange,
    disabled,
  }: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    disabled?: boolean;
  }) {
    return (
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              value === opt.value
                ? 'border-primary text-primary'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">{t('settings.printer.title')}</h1>
      </div>

      <div className="space-y-4">
        {/* Enable + auto-print */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t('settings.printer.enabled')}</p>
              <p className="text-xs text-gray-500">{t('settings.printer.enabledDescription')}</p>
            </div>
            <Toggle
              checked={printer.enabled}
              onChange={(v) => dispatch(setPrinterEnabled(v))}
              testId="printer-enabled-toggle"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t('settings.printer.autoPrint')}</p>
              <p className="text-xs text-gray-500">{t('settings.printer.autoPrintDescription')}</p>
            </div>
            <Toggle
              checked={printer.autoPrint}
              onChange={(v) => dispatch(setAutoPrint(v))}
              testId="auto-print-toggle"
            />
          </div>
        </div>

        {/* Bluetooth & Device card (new) */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Bluetooth size={18} className="text-primary" />
            <p className="text-sm font-semibold">
              {t('settings.printer.bluetoothSection', 'Bluetooth & Device')}
            </p>
          </div>

          {/* Mobile-only banner */}
          <div className="flex gap-2 items-start px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs">
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
            <label className="text-sm font-medium block mb-2">
              {t('settings.printer.connectionType', 'Connection Type')}
            </label>
            <Segmented<PrinterConnectionType>
              options={connectionTypeOptions}
              value={printer.connectionType}
              onChange={(v) => dispatch(setPrinterConnectionType(v))}
            />
          </div>

          {/* Selected printer */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="printer-device-name"
                className="text-sm font-medium block mb-2"
              >
                {t('settings.printer.deviceName', 'Printer Name')}
              </label>
              <input
                id="printer-device-name"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                onBlur={commitSelectedPrinter}
                placeholder={t('settings.printer.deviceNamePlaceholder', 'e.g. POS-80 Printer')}
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-transparent focus:border-primary outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="printer-device-address"
                className="text-sm font-medium block mb-2"
              >
                {t('settings.printer.deviceAddress', 'Printer Address (MAC / IP)')}
              </label>
              <input
                id="printer-device-address"
                type="text"
                value={deviceAddress}
                onChange={(e) => setDeviceAddress(e.target.value)}
                onBlur={commitSelectedPrinter}
                placeholder="00:11:22:33:44:55"
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-transparent focus:border-primary outline-none font-mono"
              />
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
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
            <label className="text-sm font-medium block mb-2">
              {t('settings.printer.imageWidth', 'Image Width (DPI)')}
            </label>
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
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="font-medium text-sm">{t('settings.printer.autoCut', 'Auto Cut')}</p>
              <p className="text-xs text-gray-500">
                {t(
                  'settings.printer.autoCutDescription',
                  'Send a cut command to the printer after each print',
                )}
              </p>
            </div>
            <Toggle
              checked={printer.autoCut ?? true}
              onChange={(v) => dispatch(setAutoCut(v))}
              testId="auto-cut-toggle"
            />
          </div>

          {/* Cut Mode — visually disabled when Auto Cut is off */}
          <div>
            <label className="text-sm font-medium block mb-2">
              {t('settings.printer.cutMode', 'Cut Mode')}
            </label>
            <Segmented<CutMode>
              options={cutModeOptions}
              value={printer.cutMode ?? 'full'}
              onChange={(v) => dispatch(setCutMode(v))}
              disabled={printer.autoCut === false}
            />
          </div>
        </div>

        {/* Paper size */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm font-medium mb-3">{t('settings.printer.paperSize')}</p>
          <div className="flex gap-3">
            {(['80mm', '58mm'] as const).map((size) => (
              <button
                key={size}
                onClick={() => dispatch(setPaperSize(size))}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium ${
                  printer.paperSize === size
                    ? 'border-primary text-primary'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Print format */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm font-medium mb-3">{t('settings.printer.printFormat')}</p>
          <div className="flex gap-3">
            {(['receipt', 'detailed', 'compact'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => dispatch(setPrintFormat(fmt))}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize ${
                  printer.printFormat === fmt
                    ? 'border-primary text-primary'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {t(`settings.printer.format${fmt}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
