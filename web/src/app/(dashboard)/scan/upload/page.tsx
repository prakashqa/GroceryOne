'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

export default function ScanUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setUploading(true);
    // TODO: Send to OCR API endpoint and navigate to review page
    setTimeout(() => {
      setUploading(false);
      router.push('/scan/review');
    }, 1500);
  };

  return (
    <div className="page page-container">
      <h1 className="page-title mb-6">Scan Order</h1>

      <div className="card p-6 sm:p-8">
        {preview ? (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Order preview" className="max-h-80 mx-auto rounded-lg mb-4 object-contain" />
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="btn-secondary">
                Choose Different
              </button>
              <button onClick={handleProcess} disabled={uploading} className="btn-primary">
                {uploading ? 'Processing…' : 'Process Image'}
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-line dark:border-line-dark rounded-2xl p-10 sm:p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/[0.02] transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-primary dark:text-primary-light" strokeWidth={1.8} />
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Upload Order Image</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Drag &amp; drop or click to browse</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Supports JPG, PNG up to 10MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
}
