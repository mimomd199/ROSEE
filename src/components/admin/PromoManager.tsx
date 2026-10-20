import React, { useState } from 'react';
import { Tag, Plus, Trash2, Power, Users, Clock, CheckCircle2, X } from 'lucide-react';
import { PromoCode, Order } from '../../types';

interface PromoManagerProps {
  promoCodes: { [code: string]: PromoCode };
  orders: Order[];
  onSavePromoCodes: (updated: { [code: string]: PromoCode }) => Promise<void>;
  onLogAction: (action: string) => void;
}

export const PromoManager: React.FC<PromoManagerProps> = ({
  promoCodes,
  orders,
  onSavePromoCodes,
  onLogAction
}) => {
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('100');
  const [newAllowedPhones, setNewAllowedPhones] = useState('');

  const [inspectCode, setInspectCode] = useState<string | null>(null);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    const discount = parseInt(newDiscount);
    const maxUses = parseInt(newMaxUses) || 100;

    if (!cleanCode || isNaN(discount) || discount <= 0 || discount > 100) {
      alert('يرجى التأكد من إدخال رمز الكود ونسبة الخصم (1-100%) بشكل صحيح.');
      return;
    }

    // Parse restricted customer phone numbers if specified
    const phonesList = newAllowedPhones
      .split(/[,\s]+/)
      .map(p => p.replace(/\D/g, '').trim())
      .filter(p => p.length >= 8);

    const updated = {
      ...promoCodes,
      [cleanCode]: {
        discountPercent: discount,
        expiryDate: newExpiry ? new Date(newExpiry).toISOString() : null,
        maxUses,
        usedCount: 0,
        isActive: true,
        allowedPhones: phonesList.length > 0 ? phonesList : undefined
      }
    };

    await onSavePromoCodes(updated);
    onLogAction(`إضافة كود خصم جديد: ${cleanCode} بنسبة ${discount}%${phonesList.length > 0 ? ` (مخصص لـ ${phonesList.length} عملاء)` : ''}`);
    setNewCode('');
    setNewDiscount('');
    setNewExpiry('');
    setNewMaxUses('100');
    setNewAllowedPhones('');
  };

  const handleToggleActive = async (code: string) => {
    const cur = promoCodes[code];
    if (!cur) return;
    const updated = {
      ...promoCodes,
      [code]: {
        ...cur,
        isActive: !cur.isActive
      }
    };
    await onSavePromoCodes(updated);
    onLogAction(`تغيير حالة كود الخصم ${code} إلى ${!cur.isActive ? 'نشط' : 'معطل'}`);
  };

  const handleDeletePromo = async (code: string) => {
    const updated = { ...promoCodes };
    delete updated[code];
    await onSavePromoCodes(updated);
    onLogAction(`حذف كود الخصم: ${code}`);
  };

  // Find customers who used the inspected code
  const codeUsers = inspectCode
    ? orders
        .filter(o => !o.archived && o.discountReason?.toLowerCase().includes(inspectCode.toLowerCase()))
        .map(o => ({
          orderId: o.id,
          name: o.name,
          phone: o.phone,
          date: o.date,
          status: o.status
        }))
    : [];

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Create Promo Code Card */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#C5A059]" />
          إضافة كود خصم جديد
        </h3>

        <form onSubmit={handleCreatePromo} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">رمز الكود *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="مثال: ROSE20"
                className="w-full p-2.5 text-xs border border-gray-200 rounded-xl uppercase font-bold tracking-wider focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">نسبة الخصم (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                placeholder="مثال: 15"
                className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">تاريخ الانتهاء (اختياري)</label>
              <input
                type="datetime-local"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">الحد الأقصى للاستخدام</label>
              <input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* Customer Specific Phone Restriction */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-gray-800">
              🎯 تخصيص الكود لعملاء محددين بأرقام هواتفهم (اختياري):
            </label>
            <p className="text-[11px] text-gray-500">
              إذا أدخلت أرقام هواتف (مفصولة بفواصل أو مسافات)، فلن يتمكن سوى أصحاب هذه الأرقام من تطبيق الكود عند الطلب بنفس رقم الموبايل. اتركها فارغة ليكون الكود عاماً لجميع العملاء.
            </p>
            <input
              type="text"
              value={newAllowedPhones}
              onChange={(e) => setNewAllowedPhones(e.target.value)}
              placeholder="مثال: 01012345678, 01198765432, 01234567890"
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] font-mono"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              ➕ حفظ وتفعيل كود الخصم
            </button>
          </div>
        </form>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">أكواد الخصم الحالية</h3>
          <span className="text-xs text-gray-400">{Object.keys(promoCodes).length} أكواد مسجلة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b border-gray-100">
                <th className="py-3 px-4 font-bold">كود الخصم</th>
                <th className="py-3 px-4 font-bold text-center">نسبة الخصم</th>
                <th className="py-3 px-4 font-bold text-center">الجمهور المستهدف</th>
                <th className="py-3 px-4 font-bold text-center">الاستخدامات</th>
                <th className="py-3 px-4 font-bold">تاريخ الانتهاء</th>
                <th className="py-3 px-4 font-bold text-center">الحالة</th>
                <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {Object.keys(promoCodes).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    لم تقم بإنشاء أي أكواد خصم بعد.
                  </td>
                </tr>
              ) : (
                Object.entries(promoCodes).map(([code, p]) => (
                  <tr key={code} className={`hover:bg-gray-50/50 ${!p.isActive ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-bold text-gray-900 font-brand tracking-wider">
                      {code}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 tabular-nums">
                      {p.discountPercent}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.allowedPhones && p.allowedPhones.length > 0 ? (
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-block cursor-help"
                          title={`مخصص لـ: ${p.allowedPhones.join('، ')}`}
                        >
                          👤 خاص ({p.allowedPhones.length} هواتف)
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">عام لجميع العملاء</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium tabular-nums">
                      {p.usedCount || 0} / {p.maxUses || '∞'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {p.expiryDate ? new Date(p.expiryDate).toLocaleString('ar-EG') : 'بدون انتهاء'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {p.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectCode(code)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض العملاء المستخدمين"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={p.isActive ? 'تعطيل الكود' : 'تفعيل الكود'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(code)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Promo Users Modal */}
      {inspectCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 font-arabic border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A059]" />
                العملاء الذين استخدموا كود: <span className="font-brand text-[#C5A059]">{inspectCode}</span>
              </h3>
              <button onClick={() => setInspectCode(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {codeUsers.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">
                  لم يتم استخدام هذا الكود في أي طلبات حتى الآن.
                </p>
              ) : (
                codeUsers.map((u, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{u.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono" dir="ltr">{u.phone}</p>
                    </div>
                    <div className="text-left">
                      <span className="font-mono text-gray-700">طلب #{u.orderId}</span>
                      <p className="text-[10px] text-gray-400">{new Date(u.date).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
