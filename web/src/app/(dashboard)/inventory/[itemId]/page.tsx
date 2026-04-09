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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/inventory" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{item.name}</h1>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Category</p>
            <p className="font-medium">{category?.icon} {category?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Unit</p>
            <p className="font-medium">{item.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Price</p>
            <p className="font-medium">₹{item.price || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">MRP</p>
            <p className="font-medium">₹{item.mrp || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Stock Quantity</p>
            <p className={`text-2xl font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-600'}`}>
              {item.stockQuantity || 0} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Low Stock Threshold</p>
            <p className="font-medium">{item.lowStockThreshold || 5} {item.unit}</p>
          </div>
        </div>

        {(isLow || isOut) && (
          <div className={`mt-6 p-4 rounded-xl ${isOut ? 'bg-red-50 dark:bg-red-900/20 border border-red-200' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200'}`}>
            <div className="flex items-center gap-2">
              <Package size={18} className={isOut ? 'text-red-600' : 'text-orange-600'} />
              <span className={`font-medium text-sm ${isOut ? 'text-red-700' : 'text-orange-700'}`}>
                {isOut ? 'Out of Stock - Restock needed' : 'Low Stock - Consider restocking'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
