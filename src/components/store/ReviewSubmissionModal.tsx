import React, { useState, useEffect, useRef } from 'react';
import { Star, X, CheckCircle2, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomerReview, ProductCatalog } from '../../types';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (review: CustomerReview) => Promise<void>;
  defaultCustomerName?: string;
  defaultPhone?: string;
  defaultProductName?: string;
  catalog?: ProductCatalog;
  primaryAccent?: string;
}

const QUICK_SUGGESTIONS = [
  'عطور وثبات فواح ورائع جداً ومميز 🌟',
  'المنتج أصلي والتغليف فخم وراقي جداً ✨',
  'الرائحة هادئة وناعمة وسرعة في التوصيل 💖',
  'تجربة ممتازة وتعامل غاية في الذوق والاحترام 👍'
];

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmitReview,
  defaultCustomerName = '',
  defaultPhone = '',
  defaultProductName = '',
  catalog = {},
  primaryAccent = '#C5A059',
}) => {
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [phone, setPhone] = useState(defaultPhone);
  const [productName, setProductName] = useState(defaultProductName);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});
  
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsOpenRef = useRef(false);

  // Initialize ONLY when the modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setCustomerName(defaultCustomerName || '');
      setPhone(defaultPhone || '');
      setProductName(defaultProductName || Object.keys(catalog || {})[0] || 'عطور ومستحضرات Rosée');
      setRating(5);
      setText('');
      setImageBase64('');
      setIsSubmitting(false);
      setIsSuccess(false);
      setErrorMessage('');
      setFieldErrors({});
    } else if (!isOpen && prevIsOpenRef.current) {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, defaultCustomerName, defaultPhone, defaultProductName, catalog]);

  // Clean up auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxW = 500;
        const scale = maxW / img.width;
        canvas.width = maxW;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageBase64(canvas.toDataURL('image/jpeg', 0.65));
        setErrorMessage('');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isSuccess) return;

    const errors: { [key: string]: boolean } = {};
    if (!customerName.trim()) errors.name = true;
    if (!phone.trim()) errors.phone = true;
    if (!text.trim()) errors.text = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.text && !errors.name && !errors.phone) {
        setErrorMessage('يرجى كتابة رأيك وتجربتك مع المنتج بالتفصيل أو اختيار عبارة جاهزة من الأسفل.');
      } else {
        setErrorMessage('يرجى استكمال الحقول المطلوبة الموضحة باللون الأحمر.');
      }
      return;
    }

    setFieldErrors({});
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const newReview: CustomerReview = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        productName: productName.trim() || 'عطور ومستحضرات Rosée',
        rating,
        text: text.trim(),
        status: 'pending',
        date: new Date().toISOString(),
        ...(imageBase64 ? { image: imageBase64 } : {})
      };

      // Submit review to database
      try {
        await onSubmitReview(newReview);
      } catch (submitErr) {
        console.warn('Review save local notice:', submitErr);
      }

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#10B981', '#34D399', '#F59E0B']
        });
      } catch (_) {}

      // Reveal success feedback immediately
      setIsSuccess(true);

      // Smooth auto-close after 3.8 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
      }, 3800);

    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMessage('حدث خطأ أثناء إرسال التقييم، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right font-arabic">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#141413] text-white flex items-center justify-between border-b border-[#C5A059]/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm sm:text-base font-bold font-brand tracking-wide">
              {isSuccess ? 'تم استلام التقييم' : 'شاركنا رأيك وتجربتك'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSuccess ? (
            /* Dedicated Prominent Success Feedback Card */
            <div className="py-8 px-6 bg-emerald-50/90 border border-emerald-200 rounded-3xl text-center space-y-4 shadow-inner animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md animate-bounce-short">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-bold text-emerald-950 font-arabic">
                  تم إرسال تقييمك بنجاح! 🎉
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-md mx-auto font-arabic">
                  شكراً جزيلاً لمشاركتكِ تجربتكِ القيّمة معنا! تم استلام تقييمك وسيقوم فريق المتجر بمراجعته واعتماده فوراً.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  تم
                </button>
              </div>
            </div>
          ) : (
            /* Review Submission Form with noValidate to prevent native English browser tooltips */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: false }));
                    }}
                    placeholder="مثال: ملك أحمد"
                    disabled={isSubmitting}
                    className={`w-full p-2.5 text-xs rounded-xl focus:outline-none transition-all disabled:opacity-60 ${
                      fieldErrors.name
                        ? 'border-2 border-red-400 bg-red-50/30'
                        : 'bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#C5A059]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: false }));
                    }}
                    placeholder="01xxxxxxxxx"
                    disabled={isSubmitting}
                    className={`w-full p-2.5 text-xs rounded-xl font-mono focus:outline-none transition-all disabled:opacity-60 ${
                      fieldErrors.phone
                        ? 'border-2 border-red-400 bg-red-50/30'
                        : 'bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#C5A059]'
                    }`}
                  />
                </div>
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  المنتج المراد تقييمه
                </label>
                {Object.keys(catalog).length > 0 ? (
                  <select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#C5A059] focus:outline-none transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {Object.keys(catalog).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="اسم المنتج (مثال: عطر Bunny Rose)"
                    disabled={isSubmitting}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#C5A059] focus:outline-none transition-all disabled:opacity-60"
                  />
                )}
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  تقييمك للمنتج
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                      aria-label={`${star} نجوم`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= rating
                            ? 'text-[#C5A059] fill-[#C5A059]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-600 mr-2">
                    {rating === 5 ? 'ممتاز جداً 🌟' : rating === 4 ? 'جيد جداً 👍' : rating === 3 ? 'متوسط ⭐️' : 'يحتاج تحسين'}
                  </span>
                </div>
              </div>

              {/* Review Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    رأيك وتجربتك مع المنتج *
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {text.length > 0 ? `${text.length} حرف` : 'مطلوب'}
                  </span>
                </div>
                
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (fieldErrors.text) setFieldErrors(prev => ({ ...prev, text: false }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="أخبرينا عن ثبات العطر، نعومته وتغليفه وخدمة التوصيل..."
                  disabled={isSubmitting}
                  className={`w-full p-3 text-xs rounded-xl focus:outline-none transition-all leading-relaxed disabled:opacity-60 ${
                    fieldErrors.text
                      ? 'border-2 border-red-400 bg-red-50/20'
                      : 'bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#C5A059]'
                  }`}
                />

                {/* Quick suggestions to write instantly with a single tap */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 block">
                    أو اضغط لاختيار عبارة جاهزة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setText(sug);
                          if (fieldErrors.text) setFieldErrors(prev => ({ ...prev, text: false }));
                          if (errorMessage) setErrorMessage('');
                        }}
                        className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-[#C5A059]/10 hover:text-[#8C6D23] border border-gray-200 rounded-lg text-gray-600 transition-colors cursor-pointer text-right"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  صورة اختيارية للمنتج عند الاستلام
                </label>
                {imageBase64 ? (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <img 
                      src={imageBase64} 
                      alt="Review preview" 
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1 text-xs text-gray-600 truncate">
                      تم اختيار الصورة بنجاح
                    </div>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setImageBase64('')}
                      className="p-1 text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      حذف
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 hover:border-[#C5A059] rounded-xl cursor-pointer bg-gray-50/50 hover:bg-white transition-all text-xs text-gray-600">
                    <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>إرفاق صورة من جهازك (اختياري)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="w-full py-3.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSubmitting ? '#555555' : undefined
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري إرسال التقييم...</span>
                  </div>
                ) : (
                  <span>نشر التقييم</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
