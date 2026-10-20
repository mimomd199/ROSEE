import React, { useState } from 'react';
import { Gift, Plus, Trash2, Eye, EyeOff, Save, Bell, Image } from 'lucide-react';
import { Offer } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface OffersManagerProps {
  offers: Offer[];
  globalAlert: string;
  onSaveOffers: (updated: Offer[]) => Promise<void>;
  onSaveGlobalAlert: (alertText: string) => Promise<void>;
  onLogAction: (action: string) => void;
}

export const OffersManager: React.FC<OffersManagerProps> = ({
  offers,
  globalAlert,
  onSaveOffers,
  onSaveGlobalAlert,
  onLogAction
}) => {
  const [alertInput, setAlertInput] = useState(globalAlert);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerText, setOfferText] = useState('');
  const [offerImage, setOfferImage] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  const handleSaveAlert = async () => {
    setIsSavingAlert(true);
    try {
      await onSaveGlobalAlert(alertInput.trim());
      onLogAction('تحديث شريط التنبيه الإعلاني العام بالمتجر');
      alert('✅ تم نشر التنبيه بنجاح في أعلى المتجر!');
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerText.trim()) {
      alert('يرجى ملء عنوان العرض والتفاصيل.');
      return;
    }

    const newOffer: Offer = {
      id: `OFF-${Date.now()}`,
      title: offerTitle.trim(),
      text: offerText.trim(),
      image: offerImage.trim() || undefined,
      status: 'published'
    };

    const updated = [newOffer, ...offers];
    await onSaveOffers(updated);
    onLogAction(`إنشاء عرض تسويقي جديد: ${offerTitle}`);
    setOfferTitle('');
    setOfferText('');
    setOfferImage('');
  };

  const handleTogglePublish = async (offerId: string) => {
    const updated = offers.map(o => {
      if (o.id === offerId) {
        const nextStatus: 'scheduled' | 'published' = o.status === 'published' ? 'scheduled' : 'published';
        return { ...o, status: nextStatus };
      }
      return o;
    });
    await onSaveOffers(updated);
    onLogAction('تغيير حالة نشر العرض التسويقي');
  };

  const handleDeleteOffer = async (offerId: string) => {
    const updated = offers.filter(o => o.id !== offerId);
    await onSaveOffers(updated);
    onLogAction('حذف عرض تسويقي');
  };

  return (
    <div className="space-y-6 font-arabic">
      
      {/* 1. Global Alert Top Banner Controller */}
      <div className="p-6 bg-[#FAF3E0] border border-[#C5A059]/30 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#8C6D2D]">
          <Bell className="w-5 h-5 text-[#C5A059]" />
          <h3 className="text-base font-bold">شريط الإعلانات والتنبيهات العام (أعلى المتجر)</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          يظهر هذا التنبيه لجميع زوار المتجر في شريط بارز بأعلى الصفحة (للإعلان عن شحن مجاني، إجازات، أو عينات هدايا).
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={alertInput}
            onChange={(e) => setAlertInput(e.target.value)}
            placeholder="مثال: شحن مجاني اليوم لجميع الطلبات فوق 500 ج.م..."
            className="flex-1 p-2.5 text-xs bg-white border border-[#C5A059]/40 rounded-xl focus:outline-none focus:border-[#C5A059]"
          />
          <button
            onClick={handleSaveAlert}
            disabled={isSavingAlert}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingAlert ? 'جاري الحفظ...' : 'حفظ ونشر التنبيه'}</span>
          </button>
        </div>
      </div>

      {/* 2. New Promotional Offer Card */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#C5A059]" />
          إضافة إعلان أو عرض تسويقي جديد
        </h3>

        <form onSubmit={handleCreateOffer} className="space-y-3">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">عنوان العرض *</label>
              <input
                type="text"
                required
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="مثال: باقة الأناقة - وفر 25% على العطرين"
                className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <ImageUploadInput
                label="صورة العرض الترويجي (رفع من الهاتف/الحاسوب أو لصق رابط مباشر)"
                value={offerImage}
                onChange={setOfferImage}
                placeholder="https://... أو ارفع صورة العرض من جهازك"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">تفاصيل العرض للعميل *</label>
            <textarea
              required
              rows={2}
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder="اكتب رسالة العرض التي ستظهر في كروت المتجر..."
              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              حفظ العرض كمجدول
            </button>
          </div>
        </form>
      </div>

      {/* 3. Existing Offers Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900">العروض والبانرات المسجلة ({offers.length})</h3>

        {offers.length === 0 ? (
          <div className="p-8 bg-white border border-gray-100 rounded-2xl text-center text-xs text-gray-400">
            لا توجد عروض مسجلة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const isPublished = offer.status === 'published';
              return (
                <div
                  key={offer.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                    isPublished ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-200 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isPublished ? '🟢 منشور في المتجر' : '🟡 مجدول'}
                      </span>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {offer.image && (
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-full h-32 object-cover rounded-xl border border-gray-100"
                      />
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{offer.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{offer.text}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleTogglePublish(offer.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        isPublished
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isPublished ? 'إلغاء النشر من المتجر' : 'نشر فوري في المتجر'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
