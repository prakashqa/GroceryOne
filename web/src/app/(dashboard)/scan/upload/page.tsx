'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Camera, Image } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scan Order</h1>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-8">
        {preview ? (
          <div className="text-center">
            <img src={preview} alt="Order preview" className="max-h-80 mx-auto rounded-lg mb-4 object-contain" />
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setSelectedFile(null); setPreview(null); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">Choose Different</button>
              <button onClick={handleProcess} disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50">
                {uploading ? 'Processing...' : 'Process Image'}
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-1">Upload Order Image</p>
            <p className="text-sm text-gray-500 mb-4">Drag & drop or click to browse</p>
            <p className="text-xs text-gray-400">Supports JPG, PNG up to 10MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
}
