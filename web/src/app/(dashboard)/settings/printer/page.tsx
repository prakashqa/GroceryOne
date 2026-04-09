'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectPrinter, setPrinterEnabled, setAutoPrint, setPaperSize, setPrintFormat } from '@groceryone/store';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function PrinterSettingsPage() {
  const dispatch = useAppDispatch();
  const printer = useAppSelector(selectPrinter);
  const { t } = useTranslation('profile');

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{t('settings.printer.title')}</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          <div className="px-5 py-4 flex items-center justify-between">
            <div><p className="font-medium text-sm">{t('settings.printer.enabled')}</p><p className="text-xs text-gray-500">{t('settings.printer.enabledDescription')}</p></div>
            <Toggle checked={printer.enabled} onChange={(v) => dispatch(setPrinterEnabled(v))} />
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div><p className="font-medium text-sm">{t('settings.printer.autoPrint')}</p><p className="text-xs text-gray-500">{t('settings.printer.autoPrintDescription')}</p></div>
            <Toggle checked={printer.autoPrint} onChange={(v) => dispatch(setAutoPrint(v))} />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm font-medium mb-3">{t('settings.printer.paperSize')}</p>
          <div className="flex gap-3">
            {(['80mm', '58mm'] as const).map((size) => (
              <button key={size} onClick={() => dispatch(setPaperSize(size))}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium ${printer.paperSize === size ? 'border-primary text-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm font-medium mb-3">{t('settings.printer.printFormat')}</p>
          <div className="flex gap-3">
            {(['receipt', 'detailed', 'compact'] as const).map((fmt) => (
              <button key={fmt} onClick={() => dispatch(setPrintFormat(fmt))}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize ${printer.printFormat === fmt ? 'border-primary text-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                {t(`settings.printer.format${fmt}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
