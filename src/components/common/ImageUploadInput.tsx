import React, { useRef, useState } from 'react';
import { Upload, Link2, X, Image as ImageIcon, Check } from 'lucide-react';

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  previewHeight?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'أدخل رابط الصورة أو ارفع من جهازك...',
  className = '',
  previewHeight = 'h-24'
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsProcessing(false);
        return;
      }

      // Compress/resize on canvas to avoid huge base64 strings in localstorage
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);

        onChange(compressedBase64);
        setIsProcessing(false);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2500);
      };

      img.onerror = () => {
        // Fallback to raw data url if canvas fails
        onChange(dataUrl);
        setIsProcessing(false);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2500);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
    // Reset file input so same file can be reselected
    e.target.value = '';
  };

  return (
    <div className={`space-y-2 text-right font-arabic ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-700">
          {label}
        </label>
      )}

      {/* Visual Thumbnail Preview (if value exists) */}
      {value && (
        <div className="relative inline-block border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-xs group">
          <img
            src={value}
            alt="معاينة الصورة"
            className={`w-auto ${previewHeight} object-cover rounded-2xl`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-red-600 text-white rounded-xl text-xs hover:bg-red-700 transition-colors shadow-md cursor-pointer"
              title="حذف الصورة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inputs Strip: URL field + Upload Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] bg-white text-gray-800"
          />
          <Link2 className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer ${
            justUploaded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#111111] hover:bg-[#C5A059] text-white'
          }`}
          title="رفع صورة مباشرة من اللاب توب أو الهاتف (يدعم الكاميرا والألبوم)"
        >
          {isProcessing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري المعالجة...</span>
            </>
          ) : justUploaded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>تم الرفع بنجاح!</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>رفع من الجهاز</span>
            </>
          )}
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-2.5 py-2 text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-100"
            title="تفريغ الحقل"
          >
            مسح
          </button>
        )}
      </div>
    </div>
  );
};
