'use client';

import Link from 'next/link';

export default function ScanReviewPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review Scanned Items</h1>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
        <p className="text-gray-400 mb-4">No scanned items to review.</p>
        <p className="text-sm text-gray-500 mb-4">Upload an order image first to scan and match items.</p>
        <Link href="/scan/upload" className="text-primary hover:underline text-sm font-medium">Upload Image</Link>
      </div>
    </div>
  );
}
