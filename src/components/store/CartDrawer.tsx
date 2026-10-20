import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowLeft, Tag, Copy, Check, Upload, ShieldCheck, ExternalLink, AlertCircle, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, OrderItem, ProductCatalog, PromoCode, AppSettings } from '../../types';
import { getResolvedGiftingConfig } from '../../lib/storeDefaults';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [key: string]: number };
  catalog: ProductCatalog;
  promoCodes: { [code: string]: PromoCode };
  settings: AppSettings;
  onUpdateQty: (productKey: string, newQty: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
  existingOrders: Order[];
  onSaveOrderToDb: (order: Order, updatedPromo?: { code: string; promo: PromoCode }) => Promise<void>;
  editingOrderId?: string | null;
  onRecordAbandonedCart?: (cartData: { phone: string; customerName?: string; items: OrderItem[]; totalAmount: number }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  catalog,
  promoCodes,
  settings,
  onUpdateQty,
  onClearCart,
  onOrderSuccess,
  existingOrders,
  onSaveOrderToDb,
  editingOrderId,
  onRecordAbandonedCart
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Luxury Gifting Module State
  const giftingConfig = getResolvedGiftingConfig(settings);
  const [isGift, setIsGift] = useState(false);
  const [selectedPackagingId, setSelectedPackagingId] = useState(giftingConfig?.packagingOptions?.[0]?.id || 'ribbon_gold');
  const [giftMessage, setGiftMessage] = useState('');
  const [hidePriceOnInvoice, setHidePriceOnInvoice] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'instapay'>('cod');
  const [instaRef, setInstaRef] = useState('');
  const [instaImageBase64, setInstaImageBase64] = useState<string>('');
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instaRedirectNotice, setInstaRedirectNotice] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Calculate items and subtotal with size variant support
  const activeItems: { key: string; qty: number; price: number; name: string; image: string; selectedSize?: string }[] = [];
  let subtotal = 0;
  const safeCart = cart || {};
  const safeCatalog = catalog || {};

  Object.entries(safeCart).forEach(([key, qty]) => {
    if (Number(qty) <= 0) return;
    let baseKey = key;
    let selectedSizeName = '';
    let customPrice: number | null = null;

    if (key.includes('___SIZE___')) {
      const parts = key.split('___SIZE___');
      baseKey = parts[0];
      const sizeAndPrice = parts[1];
      if (sizeAndPrice.includes('___PRICE___')) {
        const [sName, sPrice] = sizeAndPrice.split('___PRICE___');
        selectedSizeName = sName;
        customPrice = parseFloat(sPrice);
      } else {
        selectedSizeName = sizeAndPrice;
      }
    }

    if (safeCatalog[baseKey]) {
      const item = safeCatalog[baseKey];
      const itemPrice = customPrice !== null && !isNaN(customPrice) ? customPrice : Number(item.defaultPrice) || 0;
      const cleanName = baseKey.replace(/^(.*?):\s*(.*?)\s*\((.*?)\)$/, '$2');
      const displayName = selectedSizeName ? `${cleanName} (${selectedSizeName})` : cleanName;

      activeItems.push({
        key,
        qty: Number(qty) || 1,
        price: itemPrice,
        name: displayName,
        image: item.image || '',
        selectedSize: selectedSizeName || undefined
      });
      subtotal += itemPrice * (Number(qty) || 1);
    }
  });

  const packagingList = giftingConfig?.packagingOptions || [];
  const selectedPackaging = packagingList.find(p => p.id === selectedPackagingId) || packagingList[0];
  const giftingCost = (isGift && selectedPackaging) ? (Number(selectedPackaging.price) || 0) : 0;
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + giftingCost);

  // Abandoned cart auto-capture when phone is entered (Always invoked in hook order)
  useEffect(() => {
    if (!isOpen) return;
    const cleanP = customerPhone.replace(/\D/g, '').trim();
    if (cleanP.length >= 8 && activeItems.length > 0 && onRecordAbandonedCart) {
      const timer = setTimeout(() => {
        onRecordAbandonedCart({
          phone: customerPhone.trim() + (customerPhone2.trim() ? ` - ${customerPhone2.trim()}` : ''),
          customerName: customerName.trim(),
          items: activeItems.map(it => ({
            name: it.name,
            qty: it.qty,
            unitPrice: it.price,
            selectedSize: it.selectedSize
          })),
          totalAmount: finalTotal
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, customerPhone, customerPhone2, customerName, activeItems.length, finalTotal]);

  // Early return ONLY after all hooks have been unconditionally registered
  if (!isOpen) return null;

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoMessage({ text: 'يرجى إدخال رمز كود الخصم.', isError: true });
      return;
    }

    const safePromos = promoCodes || {};
    const promo = safePromos[code];
    if (!promo || !promo.isActive) {
      setPromoMessage({ text: '❌ كود الخصم غير صحيح أو منتهي الصلاحية.', isError: true });
      setAppliedPromo(null);
      return;
    }

    // Check if promo is restricted to specific customer phones
    if (promo.allowedPhones && promo.allowedPhones.length > 0) {
      const cleanPhone = (customerPhone || '').replace(/\D/g, '').trim();
      if (!cleanPhone) {
        setPromoMessage({ text: '⚠️ هذا الكود مخصص لعملاء محددين. يرجى إدخال رقم هاتفك أولاً في خانة رقم الموبايل.', isError: true });
        return;
      }

      const isAllowed = promo.allowedPhones.some(allowedP => {
        const cleanAllowed = allowedP.replace(/\D/g, '').trim();
        return cleanPhone === cleanAllowed || cleanPhone.endsWith(cleanAllowed) || cleanAllowed.endsWith(cleanPhone);
      });

      if (!isAllowed) {
        setPromoMessage({ text: '❌ هذا الكود مخصص لعملاء محددين فقط وغير متاح لهذا الرقم.', isError: true });
        setAppliedPromo(null);
        return;
      }
    }

    if (promo.expiryDate && new Date().getTime() > new Date(promo.expiryDate).getTime()) {
      setPromoMessage({ text: '❌ انتهت صلاحية استخدام هذا الكود.', isError: true });
      setAppliedPromo(null);
      return;
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      setPromoMessage({ text: '❌ تم الوصول للحد الأقصى لاستخدام هذا الكود.', isError: true });
      setAppliedPromo(null);
      return;
    }

    setAppliedPromo({ code, discountPercent: promo.discountPercent });
    setPromoMessage({ text: `✅ تم تفعيل خصم ${promo.discountPercent}% بنجاح!`, isError: false });
  };

  const safeSettings = settings || ({} as AppSettings);

  const handleCopyInsta = () => {
    const acct = safeSettings.instapayAccount || 'rosee.cosmo@instapay';
    navigator.clipboard.writeText(acct);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2500);
  };

  const handleOpenInstaApp = () => {
    const acct = safeSettings.instapayAccount || 'rosee.cosmo@instapay';
    navigator.clipboard.writeText(acct);
    setCopiedInsta(true);
    setInstaRedirectNotice(true);
    setTimeout(() => setCopiedInsta(false), 3000);
    setTimeout(() => setInstaRedirectNotice(false), 4500);

    const targetUrl = settings.instapayLink || 'https://ipn.eg/';
    window.open(targetUrl, '_blank');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxW = 500;
        const scale = maxW / img.width;
        canvas.width = maxW;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setInstaImageBase64(canvas.toDataURL('image/jpeg', 0.65));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async () => {
    if (activeItems.length === 0) {
      setOrderError('سلة المشتريات فارغة.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderError('يرجى ملء جميع بيانات التوصيل الأساسية (الاسم، الهاتف، العنوان بالتفصيل).');
      return;
    }
    if (paymentMethod === 'instapay' && !instaRef.trim() && !instaImageBase64) {
      setOrderError('يرجى إدخال رقم العملية المرجعي لانستاباي أو إرفاق صورة إيصال التحويل.');
      return;
    }

    setOrderError(null);
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingOrderId);
      const newOrderId = editingOrderId || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

      const orderItems: OrderItem[] = activeItems.map(item => ({
        name: item.name,
        qty: item.qty,
        unitPrice: item.price,
        selectedSize: item.selectedSize
      }));

      const newOrder: Order = {
        id: newOrderId,
        date: new Date().toISOString(),
        name: customerName.trim(),
        phone: customerPhone.trim() + (customerPhone2.trim() ? ` - ${customerPhone2.trim()}` : ''),
        address: customerAddress.trim(),
        status: 'pending',
        discountVal: appliedPromo ? appliedPromo.discountPercent : 0,
        discountType: appliedPromo ? 'percent' : 'fixed',
        discountReason: appliedPromo ? `برومو: ${appliedPromo.code}` : '',
        paymentMethod,
        paymentRef: instaRef.trim() || undefined,
        paymentImage: instaImageBase64 || undefined,
        lastModifiedBy: 'العميل',
        source: 'أونلاين',
        archived: false,
        history: [
          {
            timestamp: new Date().toISOString(),
            user: 'العميل',
            action: isEdit ? 'تعديل بيانات وأصناف الطلب' : 'إنشاء طلب إلكتروني جديد'
          }
        ],
        items: orderItems,
        isGift: Boolean(isGift),
        giftPackagingId: isGift ? selectedPackaging?.id : undefined,
        giftPackagingName: isGift ? selectedPackaging?.name : undefined,
        giftPackagingPrice: isGift ? giftingCost : undefined,
        giftMessage: isGift ? giftMessage.trim() : undefined,
        hidePriceOnInvoice: isGift ? Boolean(hidePriceOnInvoice) : undefined
      };

      let promoUpdateData;
      if (appliedPromo && promoCodes[appliedPromo.code]) {
        const curPromo = promoCodes[appliedPromo.code];
        promoUpdateData = {
          code: appliedPromo.code,
          promo: {
            ...curPromo,
            usedCount: (curPromo.usedCount || 0) + 1
          }
        };
      }

      // 1. Immediately trigger the order success modal and close cart drawer
      onOrderSuccess(newOrder);
      onClearCart();
      onClose();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe if canvas unsupported
      }

      // 2. Persist order in background
      await onSaveOrderToDb(newOrder, promoUpdateData);
    } catch (err: any) {
      console.error("Order submit background error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col font-arabic overflow-hidden">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111111] font-brand tracking-wider">سلة التسوق</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#C5A059]/20 text-[#8C6D2D] rounded-full">
              {activeItems.reduce((acc, cur) => acc + cur.qty, 0)} قطع
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Cart Items List */}
          {activeItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <Tag className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">سلة التسوق فارغة حالياً.</p>
              <button
                onClick={onClose}
                className="text-xs text-[#C5A059] font-bold hover:underline"
              >
                تصفح تشكيلة العطور والمنتجات
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeItems.map((item) => (
                <div key={item.key} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={item.image || 'https://via.placeholder.com/60'} 
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs text-[#C5A059] font-semibold tabular-nums mt-0.5">{item.price} ج.م</p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        onClick={() => onUpdateQty(item.key, item.qty - 1)}
                        className="p-1.5 hover:bg-white text-gray-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-gray-900 tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.key, item.qty + 1)}
                        className="p-1.5 hover:bg-white text-gray-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => onUpdateQty(item.key, 0)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeItems.length > 0 && (
            <>
              {/* Promo Code Box */}
              <div className="p-4 bg-[#FAF9F6] border border-[#C5A059]/20 rounded-xl space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                  كود الخصم (Promo Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="مثال: ROSE15"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg uppercase tracking-wider font-semibold focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    تطبيق
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs font-semibold ${promoMessage.isError ? 'text-red-500' : 'text-emerald-600'}`}>
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                  بيانات التوصيل والشحن
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اسم العميل ثلاثي"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الموبايل *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">رقم بديل (اختياري)</label>
                    <input
                      type="tel"
                      value={customerPhone2}
                      onChange={(e) => setCustomerPhone2(e.target.value)}
                      placeholder="011xxxxxxxx"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">العنوان بالتفصيل *</label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="المحافظة، المنطقة، الشارع، رقم العمارة والشقة..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Luxury Gifting Section */}
              {giftingConfig.enabled && (
                <div className="p-4 bg-[#FAF9F6] border border-[#C5A059]/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#C5A059]" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">إرسال كهدية فاخرة (Luxury Gifting)</h4>
                        <p className="text-[10px] text-gray-500">تغليف شريطي راقي، بطاقة مطبوعة، وإخفاء السعر</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    </label>
                  </div>

                  {isGift && (
                    <div className="space-y-3 pt-2 border-t border-[#C5A059]/20 animate-fade-in">
                      {/* Packaging options */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5">اختر نوع التغليف الملكي:</label>
                        <div className="space-y-1.5">
                          {(giftingConfig?.packagingOptions || []).filter(p => p.enabled !== false).map(pkg => (
                            <label
                              key={pkg.id}
                              className={`flex items-start justify-between p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                                selectedPackagingId === pkg.id
                                  ? 'border-[#C5A059] bg-white ring-1 ring-[#C5A059] font-bold text-gray-900 shadow-2xs'
                                  : 'border-gray-200 bg-white/60 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name="giftPackaging"
                                  checked={selectedPackagingId === pkg.id}
                                  onChange={() => setSelectedPackagingId(pkg.id)}
                                  className="mt-0.5 text-[#C5A059] focus:ring-[#C5A059]"
                                />
                                <div>
                                  <span className="block">{pkg.name}</span>
                                  {pkg.description && (
                                    <span className="text-[10px] text-gray-400 font-normal block">{pkg.description}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[#8C6D2D] font-bold shrink-0 tabular-nums font-brand">
                                +{pkg.price} ج.م
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Printed message */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          نص رسالة الإهداء المطبوعة داخل الكارت:
                        </label>
                        <textarea
                          rows={2}
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="اكتب رسالتك وكلماتك الراقية هنا للمُهدى إليه..."
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059] bg-white"
                        />
                      </div>

                      {/* Hide price checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                        <input
                          type="checkbox"
                          checked={hidePriceOnInvoice}
                          onChange={(e) => setHidePriceOnInvoice(e.target.checked)}
                          className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                        />
                        <span>إخفاء الأسعار والتفاصيل المالية من الفاتورة المرفقة بالطلب</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                  طريقة الدفع
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 text-center rounded-xl border transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#111111] bg-gray-50 text-gray-900 font-bold shadow-xs'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-sm">💵</span>
                    <span className="text-xs mt-1 block">الدفع عند الاستلام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instapay')}
                    className={`p-3 text-center rounded-xl border transition-all ${
                      paymentMethod === 'instapay'
                        ? 'border-[#C5A059] bg-[#FAF9F6] text-[#8C6D2D] font-bold shadow-xs'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-sm">📱</span>
                    <span className="text-xs mt-1 block">انستاباي (InstaPay)</span>
                  </button>
                </div>

                {/* InstaPay Extra Fields */}
                {paymentMethod === 'instapay' && (
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                    <div>
                      <p className="text-xs text-purple-900 font-bold mb-1.5">حساب انستاباي المعتمد للتحويل:</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-900 shadow-xs">
                        <span className="text-sm select-all tracking-wide text-purple-950 font-bold">
                          {safeSettings.instapayAccount || 'rosee.cosmo@instapay'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyInsta}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="نسخ الحساب"
                          >
                            {copiedInsta ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedInsta ? 'تم النسخ!' : 'نسخ'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleOpenInstaApp}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#692994] hover:bg-[#521c77] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title="فتح تطبيق انستاباي للتحويل فوراً"
                          >
                            <span>تحويل مباشر عبر انستاباي</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {instaRedirectNotice && (
                        <p className="text-[11px] text-emerald-700 font-bold mt-1.5 animate-fade-in flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>تم نسخ حساب انستاباي، يمكنك إتمام التحويل عبر التطبيق والعودة لتأكيد الطلب!</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-900 mb-1">
                        رقم العملية المرجعي (12 رقم):
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={instaRef}
                        onChange={(e) => setInstaRef(e.target.value)}
                        placeholder="مثال: 123456789012"
                        className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg bg-white focus:outline-none focus:border-purple-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-900 mb-1">
                        أو إرفاق لقطة شاشة للإيصال:
                      </label>
                      <label className="flex items-center justify-center gap-2 p-2.5 bg-white border border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50/50 transition-colors text-xs text-purple-700 font-medium">
                        <Upload className="w-3.5 h-3.5" />
                        {instaImageBase64 ? 'تم إرفاق صورة الإيصال بنجاح ✓' : 'اختر صورة من جهازك'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Drawer Footer & Total */}
        {activeItems.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-[#FAF9F6] space-y-3">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="tabular-nums font-semibold text-gray-900">{subtotal.toFixed(0)} ج.م</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>خصم ({appliedPromo.code}):</span>
                  <span className="tabular-nums">-{discountAmount.toFixed(0)} ج.م</span>
                </div>
              )}
              {isGift && giftingCost > 0 && (
                <div className="flex justify-between text-[#8C6D2D] font-medium">
                  <span>تغليف إهداء ({selectedPackaging?.name}):</span>
                  <span className="tabular-nums">+{giftingCost.toFixed(0)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
                <span>الإجمالي النهائي:</span>
                <span className="tabular-nums text-base text-[#C5A059]">{finalTotal.toFixed(0)} ج.م</span>
              </div>
            </div>

            {orderError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{orderError}</span>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-md disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'جاري تأكيد الطلب...' : 'إتمام الطلب الآن'}
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>تسوق آمن ومعتمد من علامة ROSÉE</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
