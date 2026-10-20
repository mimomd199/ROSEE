import React from 'react';
import { Star, CheckCircle, Trash2, Clock, MessageSquare } from 'lucide-react';
import { CustomerReview } from '../../types';

interface ReviewsManagerProps {
  reviews: { [id: string]: CustomerReview };
  onApproveReview: (reviewId: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  reviews,
  onApproveReview,
  onDeleteReview
}) => {
  const reviewEntries = Object.entries(reviews).reverse();
  const pendingCount = reviewEntries.filter(([_, r]) => r.status === 'pending').length;

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#C5A059]" />
            إدارة تقييمات وآراء العملاء
          </h2>
          <p className="text-xs text-gray-500 mt-1">مراجعة تقييمات العملاء الواردة والموافقة على نشرها في واجهة المتجر.</p>
        </div>

        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
            ⚠️ {pendingCount} تقييمات بانتظار المراجعة
          </span>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewEntries.length === 0 ? (
          <div className="p-12 bg-white border border-gray-100 rounded-2xl text-center text-xs text-gray-400">
            لا توجد تقييمات مسجلة حتى الآن.
          </div>
        ) : (
          reviewEntries.map(([id, review]) => {
            const isApproved = review.status === 'approved';
            return (
              <div
                key={id}
                className={`p-5 bg-white border rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                  isApproved ? 'border-gray-100' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {review.image && (
                    <img
                      src={review.image}
                      alt="Customer review"
                      className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0"
                    />
                  )}

                  <div className="space-y-1 text-right flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{review.customerName}</h4>
                      <div className="flex text-[#C5A059] text-xs">
                        {Array.from({ length: review.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isApproved ? '✅ معتمد ومنشور' : '⏳ قيد المراجعة'}
                      </span>
                    </div>

                    <p className="text-xs text-[#C5A059] font-semibold">{review.productName}</p>
                    <p className="text-xs text-gray-700 leading-relaxed italic">"{review.text}"</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {new Date(review.date).toLocaleString('ar-EG')} · {review.phone}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  {!isApproved && (
                    <button
                      onClick={() => onApproveReview(id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>موافقة ونشر</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDeleteReview(id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
