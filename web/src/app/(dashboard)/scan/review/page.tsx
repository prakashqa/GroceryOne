'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

export default function ScanReviewPage() {
  return (
    <div className="page page-container">
      <h1 className="page-title mb-6">Review Scanned Items</h1>
      <div className="card">
        <EmptyState
          icon={<ClipboardList size={26} strokeWidth={1.8} />}
          title="No scanned items to review."
          hint="Upload an order image first to scan and match items."
          action={<Link href="/scan/upload" className="btn-secondary btn-sm">Upload Image</Link>}
        />
      </div>
    </div>
  );
}
