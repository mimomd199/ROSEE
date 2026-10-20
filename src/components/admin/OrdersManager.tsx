import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  MessageCircle, 
  Save, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  Eye
} from 'lucide-react';
import { Order, OrderStatus, ProductCatalog, OrderItem, PaymentStatus } from '../../types';

interface OrdersManagerProps {
  orders: Order[];
  catalog: ProductCatalog;
  onSaveOrder: (updatedOrder: Order) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCreateOrder: (newOrder: Order) => Promise<void>;
  currentUserName: string;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  catalog,
  onSaveOrder,
  onDeleteOrder,
  onCreateOrder,
  currentUserName
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id || null);

  // Active editable order state
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  
  // New order form fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newSelectedProd, setNewSelectedProd] = useState('');
  const [newProdQty, setNewProdQty] = useState(1);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [newDepositAmount, setNewDepositAmount] = useState<number>(0);

  // Add item to active order
  const [addItemKey, setAddItemKey] = useState('');
  const [addItemQty, setAddItemQty] = useState(1);

  const getSubtotal = (items?: OrderItem[]) => {
    return (items || []).reduce((acc, item) => acc + ((Number(item.unitPrice) || 0) * (Number(item.qty) || 0)), 0);
  };

  const getFinalTotal = (order: Order) => {
    const sub = getSubtotal(order.items);
    const discVal = Number(order.discountVal) || 0;
    const disc = order.discountType === 'percent'
      ? (sub * (discVal / 100))
      : discVal;
    return Math.max(0, sub - disc);
  };

  const getOrderPaymentStatus = (order: Order): PaymentStatus => {
    if (order.paymentStatus) return order.paymentStatus;
    if (order.paymentMethod === 'instapay') return 'paid';
    return 'unpaid';
  };

  const getOrderDepositAmount = (order: Order): number => {
    return Number(order.depositAmount) || 0;
  };

  const getOrderRemainingAmount = (order: Order, finalTotal?: number): number => {
    const total = finalTotal !== undefined ? finalTotal : getFinalTotal(order);
    const pStatus = getOrderPaymentStatus(order);
    if (pStatus === 'paid') return 0;
    if (pStatus === 'deposit') {
      const dep = getOrderDepositAmount(order);
      return Math.max(0, total - dep);
    }
    return total;
  };

  // Filter and sort active orders
  const activeOrders = orders.filter(o => !o.archived);
  const filteredOrders = activeOrders.filter(o => {
    const matchStatus = selectedStatusFilter === 'all' || o.status === selectedStatusFilter;
    const pStat = getOrderPaymentStatus(o);
    const matchPayment = selectedPaymentFilter === 'all' || pStat === selectedPaymentFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      o.id.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q);
    return matchStatus && matchPayment && matchSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Set selected order on mount or list change
  React.useEffect(() => {
    if (isSavingOrder) return;
    if (selectedOrderId) {
      const found = orders.find(o => o.id === selectedOrderId || String(o.id).trim() === String(selectedOrderId).trim());
      if (found) {
        if (!editOrder || editOrder.id !== selectedOrderId) {
          setEditOrder(JSON.parse(JSON.stringify(found)));
        } else if (
          found.status !== editOrder.status || 
          found.paymentStatus !== editOrder.paymentStatus || 
          (found.history?.length || 0) !== (editOrder.history?.length || 0)
        ) {
          setEditOrder(JSON.parse(JSON.stringify(found)));
        }
        return;
      }
    }
    if (filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id);
      setEditOrder(JSON.parse(JSON.stringify(filteredOrders[0])));
    } else {
      setEditOrder(null);
    }
  }, [selectedOrderId, orders, isSavingOrder]);

  const statusMeta: Record<OrderStatus, { label: string; color: string; badge: string }> = {
    pending: { label: 'معلق', color: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    processing: { label: 'قيد التنفيذ', color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    packaged: { label: 'تم التغليف', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    delivered: { label: 'تم التوصيل', color: 'bg-teal-600', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
    rejected: { label: 'مرفوض', color: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
    blocked: { label: 'محظور', color: 'bg-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' }
  };

  const paymentStatusMeta: Record<PaymentStatus, { label: string; badge: string; icon: string }> = {
    unpaid: { label: 'غير مدفوع (كاش)', badge: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🔴' },
    deposit: { label: 'عربون مدفوع', badge: 'bg-amber-50 text-amber-800 border-amber-300', icon: '🟡' },
    paid: { label: 'مدفوع بالكامل', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: '🟢' }
  };

  const handleAddItemToActive = () => {
    if (!editOrder || !addItemKey || !catalog[addItemKey]) return;
    const price = catalog[addItemKey].defaultPrice;
    const existing = editOrder.items.find(i => i.name === addItemKey);

    const updatedItems = [...editOrder.items];
    if (existing) {
      existing.qty += addItemQty;
    } else {
      updatedItems.push({
        name: addItemKey,
        qty: addItemQty,
        unitPrice: price
      });
    }

    const updatedOrder: Order = {
      ...editOrder,
      items: updatedItems,
      history: [
        {
          timestamp: new Date().toISOString(),
          user: currentUserName,
          action: `إضافة صنف: ${addItemKey} (${addItemQty})`
        },
        ...(editOrder.history || [])
      ]
    };

    setEditOrder(updatedOrder);
    setAddItemKey('');
    setAddItemQty(1);
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (!editOrder) return;
    const updatedItems = [...editOrder.items];
    if (newQty <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].qty = newQty;
    }
    setEditOrder({ ...editOrder, items: updatedItems });
  };

  const handleSaveActiveOrder = async (targetOverride?: Order) => {
    const target = targetOverride || editOrder;
    if (!target) return;
    if (target.status === 'rejected' && !target.rejectionReason?.trim()) {
      alert('يرجى كتابة سبب رفض الطلب أولاً.');
      return;
    }

    const currentTotal = getFinalTotal(target);
    const pStatus: PaymentStatus = target.paymentStatus || (target.paymentMethod === 'instapay' ? 'paid' : 'unpaid');
    const depAmt = pStatus === 'deposit' ? (Number(target.depositAmount) || 0) : undefined;
    const remaining = pStatus === 'paid' ? 0 : (pStatus === 'deposit' ? Math.max(0, currentTotal - (depAmt || 0)) : currentTotal);

    const original = orders.find(o => o.id === target.id || String(o.id).trim() === String(target.id).trim());
    const statusChanged = original && original.status !== target.status;
    const origPStatus = original ? (original.paymentStatus || (original.paymentMethod === 'instapay' ? 'paid' : 'unpaid')) : 'unpaid';
    const paymentChanged = original && (origPStatus !== pStatus || (pStatus === 'deposit' && original.depositAmount !== depAmt));

    let actionText = 'حفظ وتعديل بيانات الطلب';
    if (statusChanged && paymentChanged) {
      actionText = `تحديث الحالة التشغيلية إلى [${statusMeta[target.status].label}] وحالة السداد إلى [${paymentStatusMeta[pStatus].label}]`;
    } else if (statusChanged) {
      actionText = `تحديث حالة الطلب إلى [${statusMeta[target.status].label}]`;
    } else if (paymentChanged) {
      actionText = `تحديث حالة السداد المالي إلى [${paymentStatusMeta[pStatus].label}]${pStatus === 'deposit' ? ` (عربون: ${depAmt} ج.م - متبقي: ${remaining} ج.م)` : ''}`;
    }

    const historyEntry = {
      timestamp: new Date().toISOString(),
      user: currentUserName,
      action: actionText
    };

    const finalOrderToSave: Order = {
      ...target,
      status: target.status,
      paymentStatus: pStatus,
      depositAmount: depAmt,
      remainingAmount: remaining,
      lastModifiedBy: currentUserName,
      history: [historyEntry, ...(target.history || [])]
    };

    setIsSavingOrder(true);
    setEditOrder(finalOrderToSave);
    try {
      await onSaveOrder(finalOrderToSave);
      setSaveSuccessNotice(`✅ تم حفظ وتثبيت تعديلات الطلب #${target.id} بنجاح!`);
      setTimeout(() => {
        setSaveSuccessNotice(null);
      }, 3500);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الطلب.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Instant fast-actions for status & payment buttons
  const handleQuickSaveStatus = async (st: OrderStatus) => {
    if (!editOrder) return;
    const nextOrder: Order = { ...editOrder, status: st };
    setEditOrder(nextOrder);
    await handleSaveActiveOrder(nextOrder);
  };

  const handleQuickSavePayment = async (pStat: PaymentStatus, depAmtVal?: number) => {
    if (!editOrder) return;
    const tot = getFinalTotal(editOrder);
    const depAmt = pStat === 'deposit' ? (depAmtVal !== undefined ? depAmtVal : (editOrder.depositAmount || Math.round(tot * 0.3) || 50)) : undefined;
    const remAmt = pStat === 'paid' ? 0 : (pStat === 'deposit' ? Math.max(0, tot - (depAmt || 0)) : tot);
    const nextOrder: Order = {
      ...editOrder,
      paymentStatus: pStat,
      depositAmount: depAmt,
      remainingAmount: remAmt
    };
    setEditOrder(nextOrder);
    await handleSaveActiveOrder(nextOrder);
  };

  const handleSendWhatsApp = () => {
    if (!editOrder) return;
    const total = getFinalTotal(editOrder);
    const pStatus = getOrderPaymentStatus(editOrder);
    const depAmt = getOrderDepositAmount(editOrder);
    const remAmt = getOrderRemainingAmount(editOrder, total);
    const statusText = statusMeta[editOrder.status].label;

    let msg = `أهلاً بك من R O S É E ✨\n\n`;
    msg += `طلبكم رقم: *#${editOrder.id}*\n`;
    msg += `الحالة التشغيلية: *${statusText}*\n`;
    msg += `إجمالي الطلب: *${total.toFixed(0)} ج.م*\n`;
    
    if (pStatus === 'paid') {
      msg += `حالة السداد: *مدفوع بالكامل مسبقاً ✅*\n`;
      msg += `المبلغ المطلوب عند الاستلام: *0 ج.م*\n\n`;
    } else if (pStatus === 'deposit') {
      msg += `العربون المدفوع: *${depAmt.toFixed(0)} ج.م*\n`;
      msg += `المبلغ المتبقي المطلوب عند الاستلام: *${remAmt.toFixed(0)} ج.م*\n\n`;
    } else {
      msg += `طريقة الدفع: *الدفع نقداً عند الاستلام (COD)*\n`;
      msg += `المطلوب سداده للمندوب: *${total.toFixed(0)} ج.م*\n\n`;
    }
    
    msg += `شكراً لاختيارك وتسوقك معنا!`;

    const phone = editOrder.phone.split('-')[0].replace(/\D/g, '');
    let cleanPhone = phone;
    if (phone.startsWith('01') && phone.length === 11) cleanPhone = '2' + phone;

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('يرجى إدخال اسم العميل ورقم هاتفه.');
      return;
    }

    const newId = `ORD-${1000 + orders.length + 1}`;
    const items: OrderItem[] = [];
    if (newSelectedProd && catalog[newSelectedProd]) {
      items.push({
        name: newSelectedProd,
        qty: newProdQty,
        unitPrice: catalog[newSelectedProd].defaultPrice
      });
    }

    const initialTotal = items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const depAmt = newPaymentStatus === 'deposit' ? (Number(newDepositAmount) || 0) : undefined;
    const remaining = newPaymentStatus === 'paid' ? 0 : (newPaymentStatus === 'deposit' ? Math.max(0, initialTotal - (depAmt || 0)) : initialTotal);

    const newOrder: Order = {
      id: newId,
      date: new Date().toISOString(),
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      status: 'pending',
      paymentStatus: newPaymentStatus,
      depositAmount: depAmt,
      remainingAmount: remaining,
      discountVal: 0,
      discountType: 'fixed',
      discountReason: '',
      paymentMethod: newPaymentStatus === 'paid' ? 'instapay' : 'cod',
      lastModifiedBy: currentUserName,
      source: 'يدوي',
      archived: false,
      history: [
        {
          timestamp: new Date().toISOString(),
          user: currentUserName,
          action: `إنشاء طلب يدوي جديد (حالة الدفع: ${paymentStatusMeta[newPaymentStatus].label})`
        }
      ],
      items
    };

    await onCreateOrder(newOrder);
    setIsNewOrderModalOpen(false);
    setSelectedOrderId(newId);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewSelectedProd('');
    setNewProdQty(1);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 font-arabic">
      
      {/* Sidebar: Orders List */}
      <div className="w-full lg:w-96 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-[750px] overflow-hidden">
        
        {/* Header & New Order Button */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">سجل الطلبات</h3>
              <span className="px-2 py-0.5 bg-[#C5A059]/15 text-[#8C6D2D] rounded-full text-xs font-bold">
                {filteredOrders.length}
              </span>
            </div>
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طلب جديد</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث (اسم، هاتف، كود، عنوان)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status & Payment Tabs Filters */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">الحالة التشغيلية:</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full p-1.5 text-[11px] border border-gray-200 rounded-lg bg-white font-semibold text-gray-700 truncate"
              >
                <option value="all">كل الحالات ({activeOrders.length})</option>
                <option value="pending">🟡 معلق ({activeOrders.filter(o => o.status === 'pending').length})</option>
                <option value="processing">🔵 تنفيذ ({activeOrders.filter(o => o.status === 'processing').length})</option>
                <option value="packaged">🟢 تغليف ({activeOrders.filter(o => o.status === 'packaged').length})</option>
                <option value="delivered">🏁 توصيل ({activeOrders.filter(o => o.status === 'delivered').length})</option>
                <option value="rejected">❌ رفض ({activeOrders.filter(o => o.status === 'rejected').length})</option>
                <option value="blocked">⛔ حظر ({activeOrders.filter(o => o.status === 'blocked').length})</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">حالة الدفع المالية:</label>
              <select
                value={selectedPaymentFilter}
                onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                className="w-full p-1.5 text-[11px] border border-gray-200 rounded-lg bg-white font-semibold text-gray-700 truncate"
              >
                <option value="all">كل حالات الدفع</option>
                <option value="unpaid">🔴 غير مدفوع ({activeOrders.filter(o => getOrderPaymentStatus(o) === 'unpaid').length})</option>
                <option value="deposit">🟡 عربون ({activeOrders.filter(o => getOrderPaymentStatus(o) === 'deposit').length})</option>
                <option value="paid">🟢 مدفوع ({activeOrders.filter(o => getOrderPaymentStatus(o) === 'paid').length})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Order Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              لا توجد طلبات تطابق الفلتر الحالي.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              const itemCount = (order.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
              const totalAmount = getFinalTotal(order);
              const pStat = getOrderPaymentStatus(order);
              const dep = getOrderDepositAmount(order);
              const pMeta = paymentStatusMeta[pStat];

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setIsMobileDetailOpen(true);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-amber-50/50 border-[#C5A059] shadow-xs'
                      : 'hover:bg-gray-50/70 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-1">
                    <span className="text-xs font-bold font-brand text-gray-900">
                      #{order.id}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {order.isGift && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          🎁 هدية
                        </span>
                      )}
                      {/* Operational Status Badge */}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusMeta[order.status].badge}`}>
                        {statusMeta[order.status].label}
                      </span>
                      {/* Financial Payment Status Badge */}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-0.5 ${pMeta.badge}`}>
                        <span>{pMeta.icon}</span>
                        <span>{pStat === 'deposit' ? `عربون ${dep.toFixed(0)}` : (pStat === 'paid' ? 'مدفوع' : 'غير مدفوع')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 truncate max-w-[130px]">
                      {order.name || 'عميل بدون اسم'}
                    </span>
                    <div className="text-left font-brand">
                      <span className="font-bold text-[#111111] tabular-nums block">
                        {totalAmount.toFixed(0)} ج.م
                      </span>
                      {pStat === 'deposit' && (
                        <span className="text-[10px] font-bold text-amber-700 block">
                          متبقي: {getOrderRemainingAmount(order, totalAmount).toFixed(0)} ج.م
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5">
                    <span dir="ltr">{order.phone}</span>
                    <span>{itemCount} قطعة</span>
                  </div>

                  {/* Mobile Direct Action Indicator */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between lg:hidden text-[11px] text-[#C5A059] font-bold">
                    <span>انقر لفتح التفاصيل وتعديلها (POPUP)</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Helper to render workspace content in desktop panel or mobile popup */}
      {(() => {
        const renderWorkspace = (isModal: boolean) => {
          if (!editOrder) {
            return (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm py-12">
                اختر طلباً من القائمة لعرض التفاصيل وتعديلها.
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Modal Top Header (Mobile & Tablet Pop-up) */}
              {isModal && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#111111] text-[#C5A059] rounded-xl text-xs font-bold font-brand">
                      نافذة طلب #{editOrder.id}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">تعديل ومراجعة فورية</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDetailOpen(false)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                    title="إغلاق النافذة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Success Notification Feedback */}
              {saveSuccessNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {/* Order Header & Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-gray-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-brand text-gray-900">طلب #{editOrder.id}</h2>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      editOrder.source === 'أونلاين' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {editOrder.source === 'أونلاين' ? '🌐 من المتجر' : '👨‍💻 يدوي'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    تاريخ الطلب: {new Date(editOrder.date).toLocaleString('ar-EG')}
                  </p>
                </div>

                {/* Top Order Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>مراسلة العميل</span>
                  </button>

                  <button
                    onClick={() => handleSaveActiveOrder()}
                    disabled={isSavingOrder}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#C5A059] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 btn-pulsing"
                  >
                    {isSavingOrder ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ التعديلات</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onDeleteOrder(editOrder.id);
                      if (isModal) setIsMobileDetailOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>

                  {isModal && (
                    <button
                      type="button"
                      onClick={() => setIsMobileDetailOpen(false)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      إغلاق
                    </button>
                  )}
                </div>
              </div>

              {/* Status Change Selector & Rejection Reason */}
              <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-700">الحالة التشغيلية للطلب:</label>
                    <select
                      value={editOrder.status}
                      onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value as OrderStatus })}
                      className="p-2 text-xs font-bold rounded-lg border border-gray-200 bg-white"
                    >
                      <option value="pending">🟡 معلق</option>
                      <option value="processing">🔵 قيد التنفيذ</option>
                      <option value="packaged">🟢 تم التغليف</option>
                      <option value="delivered">🏁 تم التوصيل</option>
                      <option value="rejected">❌ مرفوض</option>
                      <option value="blocked">⛔ محظور</option>
                    </select>
                  </div>

                  {editOrder.lastModifiedBy && (
                    <span className="text-[11px] text-gray-500 font-medium">
                      آخر تعديل بواسطة: <strong className="text-gray-700">{editOrder.lastModifiedBy}</strong>
                    </span>
                  )}
                </div>

                {/* Quick Toggle Buttons for 6 Order States */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {(['pending', 'processing', 'packaged', 'delivered', 'rejected', 'blocked'] as OrderStatus[]).map(st => {
                    const isSelected = editOrder.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const next = { ...editOrder, status: st };
                          setEditOrder(next);
                        }}
                        className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                          isSelected 
                            ? 'bg-gray-900 text-white border-gray-950 shadow-xs ring-2 ring-[#C5A059]' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-sm">
                          {st === 'pending' ? '🟡' : st === 'processing' ? '🔵' : st === 'packaged' ? '🟢' : st === 'delivered' ? '🏁' : st === 'rejected' ? '❌' : '⛔'}
                        </span>
                        <span className="text-[11px]">{statusMeta[st].label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Direct Fast-Save Status Bar */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-200/80">
                  <span className="text-[11px] text-gray-500 font-medium">
                    الحالة الحالية: <strong className="text-gray-900">[{statusMeta[editOrder.status].label}]</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isSavingOrder}
                    onClick={() => handleSaveActiveOrder()}
                    className="px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                    title="حفظ وتثبيت الحالة في قاعدة البيانات فوراً"
                  >
                    <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>تثبيت الحالة الآن</span>
                  </button>
                </div>
              </div>

              {editOrder.status === 'rejected' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <label className="block text-xs font-bold text-red-700 mb-1">سبب الرفض (إلزامي):</label>
                  <input
                    type="text"
                    value={editOrder.rejectionReason || ''}
                    onChange={(e) => setEditOrder({ ...editOrder, rejectionReason: e.target.value })}
                    placeholder="مثال: تعذر التواصل هاتفياً مع العميل، أو بناءً على رغبته..."
                    className="w-full p-2 text-xs border border-red-200 rounded-lg bg-white"
                  />
                </div>
              )}

              {/* ERP Payment Status & Accounting Control (User Request: فصل حالة الدفع تماماً عن حالة الطلب) */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/60">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-bold text-gray-900">
                      حالة الدفع المالية للطلب (Payment Status - ERP Logic):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">الحالة المحددة:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                      paymentStatusMeta[editOrder.paymentStatus || (editOrder.paymentMethod === 'instapay' ? 'paid' : 'unpaid')].badge
                    }`}>
                      <span>{paymentStatusMeta[editOrder.paymentStatus || (editOrder.paymentMethod === 'instapay' ? 'paid' : 'unpaid')].icon}</span>
                      <span>{paymentStatusMeta[editOrder.paymentStatus || (editOrder.paymentMethod === 'instapay' ? 'paid' : 'unpaid')].label}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Toggle Buttons for 3 Payment States */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const curTotal = getFinalTotal(editOrder);
                      setEditOrder({
                        ...editOrder,
                        paymentStatus: 'unpaid',
                        depositAmount: undefined,
                        remainingAmount: curTotal
                      });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                      (!editOrder.paymentStatus || editOrder.paymentStatus === 'unpaid')
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    <span className="text-sm">🔴</span>
                    <span>1. لم يتم الدفع</span>
                    <span className="text-[9px] opacity-80 font-normal">كاش عند الاستلام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const curTotal = getFinalTotal(editOrder);
                      const defaultDep = editOrder.depositAmount || Math.round(curTotal * 0.3) || 50;
                      setEditOrder({
                        ...editOrder,
                        paymentStatus: 'deposit',
                        depositAmount: defaultDep,
                        remainingAmount: Math.max(0, curTotal - defaultDep)
                      });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                      editOrder.paymentStatus === 'deposit'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <span className="text-sm">🟡</span>
                    <span>2. دفع عربون / مقدم</span>
                    <span className="text-[9px] opacity-80 font-normal">جزء مدفوع والباقي متبقي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditOrder({
                        ...editOrder,
                        paymentStatus: 'paid',
                        depositAmount: undefined,
                        remainingAmount: 0
                      });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                      editOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <span className="text-sm">🟢</span>
                    <span>3. مدفوع بالكامل</span>
                    <span className="text-[9px] opacity-80 font-normal">محصل 100% بالخزنة</span>
                  </button>
                </div>

                {/* When 'deposit' is selected: Input for depositAmount & Auto-calculated remainingAmount */}
                {editOrder.paymentStatus === 'deposit' && (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          قيمة العربون المدفوع بالخزنة (ج.م):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={getFinalTotal(editOrder)}
                            value={editOrder.depositAmount !== undefined ? editOrder.depositAmount : ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const curTotal = getFinalTotal(editOrder);
                              const remaining = Math.max(0, curTotal - val);
                              setEditOrder({
                                ...editOrder,
                                depositAmount: val,
                                remainingAmount: remaining
                              });
                            }}
                            className="w-full p-2.5 border border-amber-300 rounded-lg text-xs font-bold text-center font-mono bg-white focus:outline-none focus:border-amber-500 shadow-xs"
                            placeholder="أدخل مبلغ العربون..."
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">ج.م</span>
                        </div>
                      </div>

                      {/* Remaining Calculation Live Card */}
                      <div className="p-3 bg-white rounded-xl border border-amber-300 text-center sm:min-w-[200px] shadow-xs">
                        <span className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          المبلغ المتبقي للتحصيل عند التسليم:
                        </span>
                        <span className="text-base font-extrabold text-amber-950 font-brand tabular-nums">
                          {Math.max(0, getFinalTotal(editOrder) - (Number(editOrder.depositAmount) || 0)).toFixed(0)} ج.م
                        </span>
                        <span className="text-[9px] text-amber-700 block font-semibold mt-0.5">
                          (محسوب تلقائياً: {getFinalTotal(editOrder).toFixed(0)} - {Number(editOrder.depositAmount) || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Fast-Save Payment Status Bar */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-200/80">
                  <span className="text-[11px] text-gray-500 font-medium">
                    حالة السداد المحددة: <strong className="text-gray-900">[{paymentStatusMeta[editOrder.paymentStatus || (editOrder.paymentMethod === 'instapay' ? 'paid' : 'unpaid')].label}]</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isSavingOrder}
                    onClick={() => handleSaveActiveOrder()}
                    className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                    title="حفظ وتثبيت حالة السداد في السحابة فوراً"
                  >
                    <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>تثبيت السداد الآن</span>
                  </button>
                </div>
              </div>

              {/* Customer Details Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#FAF9F6] border border-gray-100 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    value={editOrder.name}
                    onChange={(e) => setEditOrder({ ...editOrder, name: e.target.value })}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">رقم الموبايل</label>
                  <input
                    type="text"
                    value={editOrder.phone}
                    onChange={(e) => setEditOrder({ ...editOrder, phone: e.target.value })}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    value={editOrder.address}
                    onChange={(e) => setEditOrder({ ...editOrder, address: e.target.value })}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Luxury Gifting Details Box */}
              {editOrder.isGift && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <span className="text-base">🎁</span>
                      <span>هذا الطلب مسجل كـ "هدية فاخرة" (Luxury Gift)</span>
                    </div>
                    {editOrder.hidePriceOnInvoice && (
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-bold">
                        🔒 إخفاء الأسعار من الفاتورة
                      </span>
                    )}
                  </div>
                  {editOrder.giftPackagingName && (
                    <p className="text-amber-800">
                      نوع التغليف المعتمد: <strong>{editOrder.giftPackagingName}</strong>
                      {editOrder.giftPackagingPrice ? ` (+${editOrder.giftPackagingPrice} ج.م)` : ''}
                    </p>
                  )}
                  {editOrder.giftMessage && (
                    <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200 text-gray-800 italic">
                      <span className="font-bold not-italic block text-[10px] text-gray-500 mb-0.5">رسالة الإهداء المطبوعة:</span>
                      "{editOrder.giftMessage}"
                    </div>
                  )}
                </div>
              )}

              {/* Payment Details (InstaPay or COD) */}
              {editOrder.paymentMethod === 'instapay' && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-purple-900">💳 بيانات دفع انستاباي:</h4>
                    <p className="text-xs text-purple-700 mt-1">
                      الرقم المرجعي: <strong className="font-mono text-purple-900">{editOrder.paymentRef || 'لم يُحدد'}</strong>
                    </p>
                  </div>
                  {editOrder.paymentImage && (
                    <a
                      href={editOrder.paymentImage}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-300 text-purple-800 rounded-lg text-xs font-semibold hover:bg-purple-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>عرض إيصال التحويل</span>
                    </a>
                  )}
                </div>
              )}

              {/* Order Items Table & Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">الأصناف والمنتجات المطلوبة</h3>
                  <span className="text-xs text-gray-500">{editOrder.items.length} منتجات</span>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {editOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-4 hover:bg-gray-50/50">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900">{item.name}</p>
                        <p className="text-[11px] text-gray-500 tabular-nums">سعر الوحدة: {item.unitPrice} ج.م</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Qty adjustments */}
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() => handleUpdateItemQty(idx, item.qty - 1)}
                            className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold tabular-nums">{item.qty}</span>
                          <button
                            onClick={() => handleUpdateItemQty(idx, item.qty + 1)}
                            className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-bold text-gray-900 tabular-nums w-20 text-left">
                          {(item.qty * item.unitPrice).toFixed(0)} ج.م
                        </span>

                        <button
                          onClick={() => handleUpdateItemQty(idx, 0)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Box */}
                <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center gap-2">
                  <select
                    value={addItemKey}
                    onChange={(e) => setAddItemKey(e.target.value)}
                    className="flex-1 p-2 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">-- اختر صنفاً لإضافته للأوردر --</option>
                    {Object.keys(catalog).map((catName) => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={addItemQty}
                    onChange={(e) => setAddItemQty(parseInt(e.target.value) || 1)}
                    className="w-16 p-2 text-xs border border-gray-200 rounded-lg bg-white text-center font-bold"
                  />
                  <button
                    onClick={handleAddItemToActive}
                    className="px-3 py-2 bg-[#111111] hover:bg-[#C5A059] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Financial Summary Calculation */}
              <div className="p-4 bg-[#FAF9F6] border border-[#C5A059]/20 rounded-xl space-y-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold text-gray-900 tabular-nums">{getSubtotal(editOrder.items).toFixed(0)} ج.م</span>
                </div>

                {/* Discounts */}
                <div className="flex items-center justify-between text-xs gap-3">
                  <span className="text-gray-700 font-semibold">الخصم المطبق:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={editOrder.discountVal}
                      onChange={(e) => setEditOrder({ ...editOrder, discountVal: parseFloat(e.target.value) || 0 })}
                      className="w-16 p-1.5 text-xs border border-gray-200 rounded-lg bg-white text-center font-bold"
                    />
                    <select
                      value={editOrder.discountType}
                      onChange={(e) => setEditOrder({ ...editOrder, discountType: e.target.value as 'fixed' | 'percent' })}
                      className="p-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="fixed">ج.م</option>
                      <option value="percent">%</option>
                    </select>
                    <input
                      type="text"
                      value={editOrder.discountReason}
                      onChange={(e) => setEditOrder({ ...editOrder, discountReason: e.target.value })}
                      placeholder="سبب الخصم..."
                      className="w-32 p-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
                  <span>إجمالي قيمة الطلب:</span>
                  <span className="text-gray-900 tabular-nums font-brand">{getFinalTotal(editOrder).toFixed(0)} ج.م</span>
                </div>

                {/* ERP Payment Ledger Breakdown */}
                {(() => {
                  const tot = getFinalTotal(editOrder);
                  const pStat = editOrder.paymentStatus || (editOrder.paymentMethod === 'instapay' ? 'paid' : 'unpaid');
                  const dep = Number(editOrder.depositAmount) || 0;
                  const cashCollected = pStat === 'paid' ? tot : (pStat === 'deposit' ? dep : 0);
                  const remaining = pStat === 'paid' ? 0 : (pStat === 'deposit' ? Math.max(0, tot - dep) : tot);
                  const meta = paymentStatusMeta[pStat];

                  return (
                    <div className="pt-2 border-t border-dashed border-gray-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-semibold">حالة الدفع المالية:</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border flex items-center gap-1 ${meta.badge}`}>
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50/70 p-2 rounded-lg">
                        <span>السيولة النقدية المحصلة بالخزنة (Cash In):</span>
                        <span className="font-mono text-sm tabular-nums">+{cashCollected.toFixed(0)} ج.م</span>
                      </div>

                      <div className="flex items-center justify-between text-amber-800 font-bold bg-amber-50/70 p-2 rounded-lg">
                        <span>المبلغ المستحق للتحصيل عند التسليم (Receivable):</span>
                        <span className="font-mono text-sm tabular-nums">{remaining.toFixed(0)} ج.م</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Audit History Timeline */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  سجل حركات وتعديلات الطلب
                </h4>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-40 overflow-y-auto">
                  {editOrder.history && editOrder.history.length > 0 ? (
                    editOrder.history.map((hist, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between text-[11px] text-gray-600">
                        <span>{hist.action}</span>
                        <div className="flex items-center gap-2 text-gray-400 font-mono">
                          <span className="text-[#C5A059] font-bold">{hist.user}</span>
                          <span>{new Date(hist.timestamp).toLocaleTimeString('ar-EG')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-center text-xs text-gray-400">لا يوجد سجل تعديلات حتى الآن.</p>
                  )}
                </div>
              </div>

            </div>
          );
        };

        return (
          <>
            {/* Desktop Workspace */}
            <div className="hidden lg:block flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 overflow-y-auto h-[750px]">
              {renderWorkspace(false)}
            </div>

            {/* Mobile & Tablet Modal Popup for Order Details (User Request) */}
            {isMobileDetailOpen && editOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto lg:hidden">
                <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-5 sm:p-7 my-auto max-h-[92vh] overflow-y-auto border border-gray-100 font-arabic">
                  {renderWorkspace(true)}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Manual Order Creation Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 font-arabic border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              ➕ إنشاء طلب يدوي لعميل
            </h3>

            <form onSubmit={handleCreateManualOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الموبايل *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">العنوان بالتفصيل</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">المنتج الأولي</label>
                  <select
                    value={newSelectedProd}
                    onChange={(e) => setNewSelectedProd(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">-- اختياري --</option>
                    {Object.keys(catalog).map((catName) => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdQty}
                    onChange={(e) => setNewProdQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg text-center font-bold"
                  />
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-gray-700">حالة الدفع المالي المبدئية:</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setNewPaymentStatus('unpaid')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      newPaymentStatus === 'unpaid'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    🔴 لم يُدفع
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentStatus('deposit')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      newPaymentStatus === 'deposit'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    🟡 عربون
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentStatus('paid')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      newPaymentStatus === 'paid'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    🟢 مدفوع
                  </button>
                </div>
                {newPaymentStatus === 'deposit' && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">قيمة العربون (ج.م):</label>
                    <input
                      type="number"
                      min="0"
                      value={newDepositAmount || ''}
                      onChange={(e) => setNewDepositAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 text-xs border border-amber-300 rounded-lg bg-white text-center font-bold"
                      placeholder="أدخل مبلغ العربون..."
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إنشاء الطلب
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
