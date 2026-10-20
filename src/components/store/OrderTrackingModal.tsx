import React, { useState } from 'react';
import { X, Search, Clock, Package, CheckCircle2, AlertCircle, Star, Edit3, Award } from 'lucide-react';
import { Order, CustomerReview } from '../../types';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  loyaltyPointValue: number;
  onEditOrder: (order: Order) => void;
  onSubmitReview: (review: CustomerReview) => Promise<void>;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  loyaltyPointValue,
  onEditOrder,
  onSubmitReview
}) => {
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [customerPoints, setCustomerPoints] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  if (!isOpen) return null;

  const normalizePhone = (p: string) => {
    let clean = p.split('-')[0].replace(/\D/g, '');
    if (clean.startsWith('20')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setFoundOrder(null);

    const cleanOid = searchOrderId.trim().toUpperCase();
    const cleanPh = normalizePhone(searchPhone.trim());

    if (!cleanOid || !cleanPh) return;

    const matched = orders.find(o => {
      const matchId = o.id.toUpperCase() === cleanOid;
      const matchPhone = normalizePhone(o.phone).includes(cleanPh);
      return matchId && matchPhone;
    });

    if (matched) {
      setFoundOrder(matched);
      // Calculate customer loyalty points from delivered orders
      const normCustPhone = normalizePhone(matched.phone);
      let totalSpent = 0;
      orders
        .filter(o => o.status === 'delivered' && normalizePhone(o.phone) === normCustPhone)
        .forEach(o => {
          const sub = (o.items || []).reduce((acc, i) => acc + ((Number(i.unitPrice) || 0) * (Number(i.qty) || 0)), 0);
          const disc = o.discountType === 'percent' ? (sub * ((Number(o.discountVal) || 0) / 100)) : (Number(o.discountVal) || 0);
          totalSpent += Math.max(0, sub - disc);
        });
      setCustomerPoints(Math.floor(totalSpent / 100));
    }
  };

  const isEligibleForEdit = (order: Order) => {
    if (order.status !== 'pending') return false;
    const orderTime = new Date(order.date).getTime();
    const diffMinutes = (Date.now() - orderTime) / (1000 * 60);
    return diffMinutes <= 60;
  };

  const statusConfig = {
    pending: { label: 'معلق (قيد المراجعة)', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    processing: { label: 'قيد التجهيز والتنفيذ', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    packaged: { label: 'تم التغليف وجاهز للشحن', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    delivered: { label: 'تم التوصيل بنجاح', color: 'text-teal-700 bg-teal-50 border-teal-200' },
    rejected: { label: 'تم رفض الطلب', color: 'text-red-600 bg-red-50 border-red-200' },
    blocked: { label: 'محظور', color: 'text-purple-600 bg-purple-50 border-purple-200' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden font-arabic my-8 border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111111] text-white">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#C5A059]" />
            <h3 className="text-base font-bold">تتبع الطلب ونقاط الولاء</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3 p-4 bg-[#FAF9F6] rounded-xl border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الطلب (Order ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ORD-1004"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg uppercase tracking-wider font-semibold focus:outline-none focus:border-[#C5A059] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الموبايل المسجل به *</label>
                <input
                  type="tel"
                  required
                  placeholder="أدخل رقمك المسجل"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059] bg-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              بحث في سجلات الطلبات
            </button>
          </form>

          {/* Search Results */}
          {hasSearched && !foundOrder && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين. يرجى التحقق وإعادة المحاولة.</span>
            </div>
          )}

          {foundOrder && (
            <div className="space-y-5">
              
              {/* Loyalty Points Pill */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-[#111111] to-[#252525] text-white rounded-xl shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-[#C5A059]" />
                  <div>
                    <p className="text-xs text-white/80">رصيد نقاط الولاء الخاص بك</p>
                    <p className="text-sm font-bold text-[#C5A059]">{customerPoints} نقطة</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[11px] px-2 py-1 bg-white/10 rounded text-white/90">
                    تعادل خصم {customerPoints * loyaltyPointValue} ج.م
                  </span>
                </div>
              </div>

              {/* Order Status Badge & Details */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">طلب #{foundOrder.id}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      تاريخ الطلب: {new Date(foundOrder.date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[foundOrder.status]?.color || 'text-gray-700 bg-gray-100'}`}>
                    {statusConfig[foundOrder.status]?.label || foundOrder.status}
                  </span>
                </div>

                {/* Progress Stepper for Active Orders */}
                {['pending', 'processing', 'packaged', 'delivered'].includes(foundOrder.status) && (
                  <div className="py-2">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 right-4 left-4 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                      
                      {[
                        { key: 'pending', label: 'المراجعة' },
                        { key: 'processing', label: 'التجهيز' },
                        { key: 'packaged', label: 'التغليف' },
                        { key: 'delivered', label: 'التوصيل' },
                      ].map((step, idx) => {
                        const stepOrder = ['pending', 'processing', 'packaged', 'delivered'];
                        const curIdx = stepOrder.indexOf(foundOrder.status);
                        const isDone = curIdx >= idx;
                        const isCurrent = curIdx === idx;

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isDone ? 'bg-[#C5A059] text-white shadow-xs' : 'bg-gray-100 text-gray-400 border border-gray-300'
                            }`}>
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items Ordered List */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-xs font-bold text-gray-700 mb-1">المنتجات:</p>
                  {foundOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-600">
                      <span>{item.name} × {item.qty}</span>
                      <span className="font-semibold text-gray-800 tabular-nums">{item.unitPrice * item.qty} ج.م</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  {/* Self-edit within 60 mins */}
                  {isEligibleForEdit(foundOrder) && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditOrder(foundOrder);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#111111] text-[#111111] hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                      تعديل محتويات الطلب (متاح أول 60 دقيقة)
                    </button>
                  )}

                  {/* Leave review if delivered */}
                  {foundOrder.status === 'delivered' && (
                    <button
                      onClick={() => setIsReviewOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#111111] text-[#C5A059] hover:bg-[#C5A059] hover:text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5" />
                      تقييم تجربتك مع المنتجات
                    </button>
                  )}
                </div>

              </div>

              {/* Dedicated Review Popup Modal */}
              <ReviewSubmissionModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmitReview={onSubmitReview}
                defaultCustomerName={foundOrder.name}
                defaultPhone={foundOrder.phone}
                defaultProductName={foundOrder.items[0]?.name || ''}
              />

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
