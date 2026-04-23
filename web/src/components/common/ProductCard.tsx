'use client';

import { memo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  name: string;
  price?: number;
  unit: string;
  /** Pack size the price applies to (e.g. 100 for a ₹1800 / 100g pack). */
  defaultQuantity?: number;
  inCartQty?: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const ProductCard = memo(function ProductCard({
  name, price, unit, defaultQuantity, inCartQty, onAdd, onIncrement, onDecrement,
}: ProductCardProps) {
  const { t } = useTranslation('common');
  // price is the price for a pack of `defaultQuantity` units of `unit`, NOT
  // per-unit. Rendering as "₹{price}/{unit}" conflates those and implied, for
  // example, "₹1800/gm" for a ₹1800 100g pack of black pepper. Show the pack
  // size in the denominator so the rate is unambiguous.
  const priceLabel = price === undefined
    ? null
    : defaultQuantity && defaultQuantity > 0
      ? `₹${price} / ${defaultQuantity}${unit}`
      : `₹${price}/${unit}`;
  return (
    <div className={`bg-white dark:bg-surface-dark rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
      inCartQty ? 'border-in-cart-border bg-in-cart-bg dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="mb-2">
        <p className="font-medium text-sm truncate">{name}</p>
        {priceLabel && (
          <p className="text-primary font-semibold text-sm mt-0.5">{priceLabel}</p>
        )}
      </div>
      {inCartQty ? (
        <div className="flex items-center justify-between">
          <button onClick={onDecrement} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold">{inCartQty} {unit}</span>
          <button onClick={onIncrement} className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button onClick={onAdd} className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 active:scale-95 transition-all">
          + {t('picking.add')}
        </button>
      )}
    </div>
  );
});
