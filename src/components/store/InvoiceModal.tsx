import React, { useRef, useState } from 'react';
import { Order } from '../../types';
import { Download, MessageCircle, X, CheckCircle, Printer, Copy, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  brandWhatsApp: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, brandWhatsApp, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.unitPrice) || 0) * (Number(item.qty) || 0)), 0);
  const discVal = Number(order.discountVal) || 0;
  const discountAmount = order.discountType === 'percent'
    ? (subtotal * (discVal / 100))
    : discVal;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
  };

  const handleDownloadPdf = () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);

    const element = invoiceRef.current;
    const opt = {
      margin: 10,
      filename: `Rosee_Invoice_${order.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsGenerating(false);
      }).catch((err: any) => {
        console.error(err);
        setIsGenerating(false);
      });
    } else {
      window.print();
      setIsGenerating(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    let orderText = `✨ *تأكيد طلب من R O S É E* ✨\n\n`;
    orderText += `📋 *رقم الأوردر:* #${order.id}\n`;
    orderText += `👤 *اسم العميل:* ${order.name}\n`;
    orderText += `📞 *رقم الهاتف:* ${order.phone}\n`;
    orderText += `📍 *العنوان بالتفصيل:* ${order.address}\n`;
    orderText += `💳 *طريقة الدفع:* ${order.paymentMethod === 'instapay' ? '📱 انستاباي (InstaPay)' : '💵 الدفع عند الاستلام'}\n`;
    if (order.paymentRef) {
      orderText += `🔢 *رقم عملية انستاباي:* ${order.paymentRef}\n`;
    }

    orderText += `\n🛍 *المنتجات المطلوبة:*\n`;
    order.items.forEach((item, idx) => {
      orderText += `${idx + 1}. ${item.name} × ${item.qty} = ${(item.unitPrice * item.qty).toFixed(0)} ج.م\n`;
    });

    if (order.discountReason || discVal > 0) {
      orderText += `\n🏷 *كود الخصم (البروموكود):* ${order.discountReason || 'كود خصم'} (-${order.discountVal}% | -${discountAmount.toFixed(0)} ج.م)\n`;
    }

    orderText += `\n💰 *إجمالي المنتجات:* ${subtotal.toFixed(0)} ج.م\n`;
    if (discountAmount > 0) {
      orderText += `🔻 *قيمة الخصم:* -${discountAmount.toFixed(0)} ج.م\n`;
    }
    orderText += `💵 *المطلوب سداده نهائياً:* ${finalTotal.toFixed(0)} ج.م\n`;
    orderText += `\nشكراً لاختياركم علامة R O S É E ✨ يسعدنا خدمتكم دائماً!`;

    const cleanNumber = brandWhatsApp.replace(/\D/g, '') || '201117237246';
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(orderText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto font-arabic">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#C5A059]/30 animate-fade-in">
        
        {/* Top Celebratory Header Banner */}
        <div className="bg-[#111111] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            تم إتمام طلبك بنجاح! 🎉
          </h2>
          <p className="text-xs text-white/75 max-w-md mx-auto leading-relaxed">
            شكراً لتسوقك من ROSÉE، تم استلام بياناتك وتأكيد طلبك في النظام وجاري تجهيزه للشحن.
          </p>

          {/* Order ID Badge with Direct Copy Button */}
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 bg-white/10 border border-[#C5A059]/40 rounded-2xl shadow-inner">
            <span className="text-xs text-gray-300">رقم الأوردر:</span>
            <span className="text-sm font-bold font-mono tracking-wider text-[#C5A059]">
              #{order.id}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#C5A059] hover:bg-[#d6af63] text-[#111111] text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
              title="نسخ رقم الطلب"
            >
              {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-900" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOrderId ? 'تم النسخ!' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons (Invoice View & WhatsApp Confirmation) */}
        <div className="p-4 sm:p-6 bg-[#FAF9F6] border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Button 1: Toggle / Show Invoice Card */}
            <button
              type="button"
              onClick={() => setShowInvoiceDetails(prev => !prev)}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer hover:border-[#C5A059]"
            >
              <FileText className="w-4 h-4 text-[#C5A059]" />
              <span>{showInvoiceDetails ? 'إخفاء صورة الفاتورة' : 'عرض صورة فاتورة الطلب'}</span>
              {showInvoiceDetails ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>

            {/* Button 2: WhatsApp Confirmation */}
            <button
              type="button"
              onClick={handleWhatsAppConfirm}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تأكيد الطلب عبر الواتساب</span>
            </button>
          </div>
        </div>

        {/* Invoice Printable View */}
        {showInvoiceDetails && (
          <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto space-y-6" ref={invoiceRef}>
            {/* Brand Watermark & Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b-2 border-[#C5A059] gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-widest text-[#111111] font-brand">R O S É E</h1>
                <p className="text-[11px] tracking-wider text-[#C5A059] uppercase font-brand font-semibold">SKINCARE & BEAUTY — ELEVATE YOUR DAILY ROUTINE</p>
              </div>
              <div className="text-left md:text-right font-arabic">
                <span className="inline-block px-3 py-1 bg-[#111111] text-[#C5A059] text-xs font-bold rounded">
                  فاتورة شراء معتمدة
                </span>
                <p className="text-xs text-gray-500 mt-1">تاريخ الإصدار: {new Date(order.date).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            {/* Luxury Gifting Notice */}
            {order.isGift && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-300 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <span className="text-base">🎁</span>
                  <span>هذا الطلب تم إعداده كـ "هدية فاخرة" (Luxury Gift Order)</span>
                </div>
                {order.giftPackagingName && (
                  <p className="text-amber-800 text-[11px]">
                    نوع التغليف المعتمد: <strong>{order.giftPackagingName}</strong>
                  </p>
                )}
                {order.giftMessage && (
                  <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 mt-1 italic text-gray-800">
                    "{order.giftMessage}"
                  </div>
                )}
                {order.hidePriceOnInvoice && (
                  <p className="text-[10px] text-amber-700 font-bold">
                    ✓ تم إخفاء الأسعار من الفاتورة بناءً على رغبة المرسل (Gift Receipt)
                  </p>
                )}
              </div>
            )}

            {/* Customer & Order Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#FAF9F6] rounded-2xl border border-gray-100 text-xs">
              <div>
                <p className="text-xs font-bold text-[#C5A059] mb-1">بيانات العميل / المستلم:</p>
                <p className="font-semibold text-gray-900 text-sm">{order.name}</p>
                <p className="text-gray-600 text-xs mt-0.5" dir="ltr">{order.phone}</p>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed">{order.address}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#C5A059] mb-1">تفاصيل الطلب والدفع:</p>
                <p className="text-gray-700">رقم الأوردر: <strong className="text-gray-900 font-mono">#{order.id}</strong></p>
                <p className="text-gray-700 text-xs mt-1">طريقة الدفع: <span className="font-bold text-[#111111]">{order.paymentMethod === 'instapay' ? '📱 انستاباي (InstaPay)' : '💵 الدفع عند الاستلام'}</span></p>
                {order.paymentRef && (
                  <p className="text-xs text-[#C5A059] mt-1 font-mono">المرجع: {order.paymentRef}</p>
                )}
                {order.discountReason && !order.hidePriceOnInvoice && (
                  <p className="text-xs text-emerald-700 mt-1 font-semibold">كود الخصم: {order.discountReason} ({order.discountVal}%)</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#111111] text-white">
                    <th className="py-2.5 px-3 font-medium">المنتج</th>
                    <th className="py-2.5 px-3 text-center font-medium">الكمية</th>
                    {!order.hidePriceOnInvoice && (
                      <>
                        <th className="py-2.5 px-3 text-center font-medium">سعر الوحدة</th>
                        <th className="py-2.5 px-3 text-left font-medium">الإجمالي</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 px-3 text-center font-mono">{item.qty}</td>
                      {!order.hidePriceOnInvoice && (
                        <>
                          <td className="py-3 px-3 text-center tabular-nums">{item.unitPrice} ج.م</td>
                          <td className="py-3 px-3 text-left font-semibold tabular-nums text-gray-900">
                            {(item.qty * item.unitPrice).toFixed(0)} ج.م
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            {!order.hidePriceOnInvoice ? (
              <div className="flex justify-end font-arabic">
                <div className="w-full md:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>المجموع الفرعي:</span>
                    <span className="tabular-nums font-medium">{subtotal.toFixed(0)} ج.م</span>
                  </div>
                  {order.isGift && (Number(order.giftPackagingPrice) || 0) > 0 && (
                    <div className="flex justify-between text-[#8C6D2D]">
                      <span>تغليف الهدية:</span>
                      <span className="tabular-nums font-medium">+{order.giftPackagingPrice} ج.م</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>الخصم المطبق ({order.discountReason || 'بروموكود'}):</span>
                      <span className="tabular-nums font-semibold">-{discountAmount.toFixed(0)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-[#C5A059] text-sm font-bold text-[#111111]">
                    <span>المطلوب سداده:</span>
                    <span className="tabular-nums text-base text-[#C5A059]">{finalTotal.toFixed(0)} ج.م</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500 font-semibold">
                🔒 تم إخفاء الأسعار من هذه النسخة (فاتورة إهداء فاخرة بدون مبالغ مالية)
              </div>
            )}

            {/* Download PDF Option inside invoice */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{isGenerating ? 'جاري التجهيز...' : 'تحميل نسخة الفاتورة (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Bottom Close Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-900 font-semibold underline cursor-pointer"
          >
            إغلاق ومتابعة تصفح المتجر
          </button>
        </div>

      </div>
    </div>
  );
};
