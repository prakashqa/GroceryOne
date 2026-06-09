'use client';

import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectItems, selectCategories } from '@groceryone/store';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function InventoryItemDetailPage() {
  const params = useParams();
  const itemId = params.itemId as string;
  const items = useAppSelector(selectItems);
  const categories = useAppSelector(selectCategories);
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Item not found</p>
        <Link href="/inventory" className="text-primary hover:underline">Back to Inventory</Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === item.categoryId);
  const isLow = (item.stockQuantity || 0) <= (item.lowStockThreshold || 5);
  const isOut = (item.stockQuantity || 0) === 0;

  const detailItems: { label: string; value: React.ReactNode }[] = [
    { label: 'Category', value: <span className="font-medium text-gray-900 dark:text-gray-100">{category?.icon} {category?.name || 'Unknown'}</span> },
    { label: 'Unit', value: <span className="font-medium text-gray-900 dark:text-gray-100">{item.unit}</span> },
    { label: 'Price', value: <span className="font-medium text-gray-900 dark:text-gray-100">₹{item.price || 0}</span> },
    { label: 'MRP', value: <span className="font-medium text-gray-900 dark:text-gray-100">₹{item.mrp || 0}</span> },
  ];

  return (
    <div className="page page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventory" className="btn-icon" aria-label="Back"><ArrowLeft size={18} /></Link>
        <h1 className="page-title">{item.name}</h1>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {detailItems.map((d) => (
            <div key={d.label}>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{d.label}</p>
              {d.value}
            </div>
          ))}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stock Quantity</p>
            <p className={`text-2xl font-bold ${isOut ? 'text-error' : isLow ? 'text-warning' : 'text-success dark:text-green-400'}`}>
              {item.stockQuantity || 0} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Low Stock Threshold</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{item.lowStockThreshold || 5} {item.unit}</p>
          </div>
        </div>

        {(isLow || isOut) && (
          <div className={`mt-6 p-4 rounded-xl border ${isOut ? 'bg-error-bg dark:bg-error/10 border-error/30' : 'bg-warning-bg dark:bg-warning/10 border-warning/30'}`}>
            <div className="flex items-center gap-2">
              <Package size={18} className={isOut ? 'text-error' : 'text-warning'} />
              <span className={`font-medium text-sm ${isOut ? 'text-error' : 'text-warning'}`}>
                {isOut ? 'Out of Stock — Restock needed' : 'Low Stock — Consider restocking'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
