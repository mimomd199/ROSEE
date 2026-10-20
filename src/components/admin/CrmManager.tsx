import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  MessageCircle, 
  Filter, 
  Archive, 
  Award, 
  CheckSquare, 
  Square,
  ArrowUpDown,
  Send,
  X,
  Trash2,
  ShoppingCart,
  Bell,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Gift,
  Tag
} from 'lucide-react';
import { Order, ProductCatalog, AbandonedCart, BackInStockRequest } from '../../types';

interface CrmManagerProps {
  orders: Order[];
  catalog: ProductCatalog;
  promoCodes: Record<string, any>;
  onArchiveCustomer: (phone: string) => Promise<void>;
  onDeleteCustomer: (phone: string) => Promise<void>;
  abandonedCarts?: AbandonedCart[];
  onDeleteAbandonedCart?: (id: string) => void;
  onRecoverAbandonedCart?: (id: string) => void;
  backInStockRequests?: BackInStockRequest[];
  onDeleteBackInStockRequest?: (id: string) => void;
  onNotifyBackInStock?: (productKey: string) => void;
}

export const CrmManager: React.FC<CrmManagerProps> = ({
  orders,
  catalog,
  promoCodes,
  onArchiveCustomer,
  onDeleteCustomer,
  abandonedCarts = [],
  onDeleteAbandonedCart,
  onRecoverAbandonedCart,
  backInStockRequests = [],
  onDeleteBackInStockRequest,
  onNotifyBackInStock
}) => {
  const [crmSubTab, setCrmSubTab] = useState<'customers' | 'abandoned' | 'back_in_stock'>('customers');

  // Customers Filter States
  const [filterName, setFilterName] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterMinOrders, setFilterMinOrders] = useState<number>(0);
  
  const [smartProduct, setSmartProduct] = useState('');
  const [smartPromo, setSmartPromo] = useState('');
  const [smartActivity, setSmartActivity] = useState<'all' | 'active' | 'inactive'>('all');
  const [activityDays, setActivityDays] = useState(30);

  const [sortMode, setSortMode] = useState<'count' | 'newest'>('count');
  const [selectedCustomerPhones, setSelectedCustomerPhones] = useState<Set<string>>(new Set());

  // Bulk WhatsApp Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('مرحباً بكِ من عائلة R O S É E ✨ يسعدنا إعلامك ببدء عروضنا الحصرية وتشكيلة العطور الجديدة مع هدية خاصة لكِ!');
  const [bulkQueue, setBulkQueue] = useState<{ name: string; phone: string }[]>([]);
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0);

  // Abandoned Carts Filter States
  const [abandonedTimeFilter, setAbandonedTimeFilter] = useState<'all' | '30m' | '1h' | '24h'>('all');
  const [recoveryDiscountCode, setRecoveryDiscountCode] = useState('ROSE15');

  const normalizePhone = (p: string) => {
    let clean = p.split('-')[0].replace(/\D/g, '');
    if (clean.startsWith('20')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };

  // Group orders by customer
  const customerMap: Record<string, {
    name: string;
    originalPhone: string;
    address: string;
    deliveredCount: number;
    totalOrdersCount: number;
    latestDate: Date;
    totalPaid: number;
    productsBought: Set<string>;
    promosUsed: Set<string>;
  }> = {};

  orders.filter(o => !o.archived).forEach(order => {
    if (!order.phone) return;
    const rawP = order.phone.split('-')[0].trim();
    const nP = normalizePhone(rawP);
    if (!nP) return;

    if (!customerMap[nP]) {
      customerMap[nP] = {
        name: order.name,
        originalPhone: rawP,
        address: order.address,
        deliveredCount: 0,
        totalOrdersCount: 0,
        latestDate: new Date(0),
        totalPaid: 0,
        productsBought: new Set(),
        promosUsed: new Set()
      };
    }

    customerMap[nP].totalOrdersCount++;
    const isDelivered = order.status === 'delivered';
    if (isDelivered) {
      customerMap[nP].deliveredCount++;
    }

    const oDate = new Date(order.date);
    if (oDate > customerMap[nP].latestDate) {
      customerMap[nP].latestDate = oDate;
      customerMap[nP].name = order.name;
      customerMap[nP].address = order.address;
    }

    if (order.status !== 'rejected' && order.status !== 'blocked') {
      const orderTotal = (order.items || []).reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
      const disc = order.discountType === 'percent' ? (orderTotal * (order.discountVal / 100)) : order.discountVal;
      customerMap[nP].totalPaid += Math.max(0, orderTotal - disc);
    }

    (order.items || []).forEach(item => {
      customerMap[nP].productsBought.add(item.name);
    });

    if (order.discountReason) {
      customerMap[nP].promosUsed.add(order.discountReason.replace('برومو: ', '').trim());
    }
  });

  const now = new Date().getTime();

  // Filter customers
  const filteredCustomers = Object.values(customerMap).filter(c => {
    if (filterName && !c.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterPhone && !c.originalPhone.includes(filterPhone)) return false;
    if (filterAddress && !c.address.toLowerCase().includes(filterAddress.toLowerCase())) return false;
    if (c.deliveredCount < filterMinOrders) return false;

    if (smartProduct) {
      const matchProd = Array.from(c.productsBought).some(p => p.includes(smartProduct));
      if (!matchProd) return false;
    }

    if (smartPromo) {
      const matchPromo = Array.from(c.promosUsed).some(p => p === smartPromo);
      if (!matchPromo) return false;
    }

    if (smartActivity !== 'all') {
      const daysDiff = (now - c.latestDate.getTime()) / (1000 * 3600 * 24);
      if (smartActivity === 'active' && daysDiff > activityDays) return false;
      if (smartActivity === 'inactive' && daysDiff <= activityDays) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortMode === 'count') return b.deliveredCount - a.deliveredCount;
    return b.latestDate.getTime() - a.latestDate.getTime();
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPhones = new Set(filteredCustomers.map(c => c.originalPhone));
      setSelectedCustomerPhones(allPhones);
    } else {
      setSelectedCustomerPhones(new Set());
    }
  };

  const isAllSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerPhones.has(c.originalPhone));

  const handleToggleCustomer = (phone: string) => {
    const next = new Set(selectedCustomerPhones);
    if (next.has(phone)) next.delete(phone);
    else next.add(phone);
    setSelectedCustomerPhones(next);
  };

  const handleExportCSV = () => {
    let csv = '\uFEFFاسم العميل,رقم الموبايل,العنوان,الطلبات المكتملة,إجمالي المشتريات,نقاط الولاء\n';
    filteredCustomers.forEach(c => {
      const points = Math.floor(c.totalPaid / 100);
      csv += `"${c.name.replace(/"/g, '""')}","${c.originalPhone}","${c.address.replace(/"/g, '""')}",${c.deliveredCount},${c.totalPaid.toFixed(0)},${points}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rosee_CRM_Customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleStartBulkSender = () => {
    const queue = filteredCustomers
      .filter(c => selectedCustomerPhones.has(c.originalPhone))
      .map(c => ({ name: c.name, phone: c.originalPhone }));

    if (queue.length === 0) {
      alert('يرجى تحديد عميل واحد على الأقل من الجدول أولاً.');
      return;
    }

    setBulkQueue(queue);
    setCurrentBulkIndex(0);
    setIsBulkModalOpen(true);
  };

  const handleSendToCurrentBulk = () => {
    if (currentBulkIndex >= bulkQueue.length) return;
    const target = bulkQueue[currentBulkIndex];
    let phone = target.phone.split('-')[0].replace(/\D/g, '');
    if (phone.startsWith('01') && phone.length === 11) phone = '2' + phone;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(bulkMessage)}`, '_blank');
  };

  // --- ABANDONED CARTS LOGIC ---
  const filteredAbandonedCarts = abandonedCarts.filter(cart => {
    if (abandonedTimeFilter === 'all') return true;
    const cartTime = new Date(cart.updatedAt).getTime();
    const diffHours = (now - cartTime) / (1000 * 3600);
    if (abandonedTimeFilter === '30m') return diffHours >= 0.5;
    if (abandonedTimeFilter === '1h') return diffHours >= 1;
    if (abandonedTimeFilter === '24h') return diffHours >= 24;
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleSendAbandonedRecoveryWhatsApp = (cart: AbandonedCart) => {
    let cleanPhone = cart.phone.split('-')[0].replace(/\D/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) cleanPhone = '2' + cleanPhone;

    const itemsList = (cart.items || []).map(i => `• ${i.name} (عدد ${i.qty})`).join('\n');
    const custName = cart.customerName ? `أستاذ/ة ${cart.customerName}` : 'عزيزي/تي';

    const msg = `مرحباً بكِ ${custName} من عائلة R O S É E ✨\n\nلاحظنا اهتمامكِ بمنتجاتنا الفاخرة وأنكِ تركتِ هذه التشكيلة المميزة في سلتكِ:\n${itemsList}\n\nبإجمالي: ${cart.totalAmount.toFixed(0)} ج.م\n\nولأننا نسعد دائماً بخدمتكِ، يسعدنا تقديم كود خصم حصري لكِ الآن:\n🎁 كود الخصم: *${recoveryDiscountCode}*\n\nيمكنكِ استخدامه فوراً لإتمام طلبكِ والاستمتاع بتجربة ROSÉE الفاخرة: https://rosee.eg`;

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- BACK IN STOCK LOGIC ---
  // Group waitlist by productKey
  const backInStockGrouped: { [productKey: string]: { productKey: string; productName: string; requests: BackInStockRequest[] } } = {};
  backInStockRequests.forEach(req => {
    if (!backInStockGrouped[req.productKey]) {
      backInStockGrouped[req.productKey] = {
        productKey: req.productKey,
        productName: req.productName || req.productKey,
        requests: []
      };
    }
    backInStockGrouped[req.productKey].requests.push(req);
  });

  const handleSendBackInStockBulkWhatsApp = (group: { productKey: string; productName: string; requests: BackInStockRequest[] }) => {
    const unnotified = group.requests.filter(r => !r.notified);
    if (unnotified.length === 0) {
      alert('تم إرسال إشعار توفر لجميع العملاء المسجلين في قائمة الانتظار لهذا المنتج بالفعل.');
      return;
    }

    const firstCust = unnotified[0];
    let cleanPhone = firstCust.customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) cleanPhone = '2' + cleanPhone;

    const msg = `بشرى سارة من R O S É E ✨\n\nالمنتج الذي كنتِ بانتظاره:\n👑 *${group.productName}*\nأصبح متوفراً الآن في المتجر بكمية محدودة!\n\nيمكنكِ طلبه الآن فوراً قبل نفاد الكمية: https://rosee.eg`;

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
    if (onNotifyBackInStock) {
      onNotifyBackInStock(group.productKey);
    }
  };

  const unrecoveredCount = abandonedCarts.filter(c => !c.recovered).length;
  const waitingCustomersCount = backInStockRequests.filter(r => !r.notified).length;

  return (
    <div className="space-y-6 font-arabic animate-fade-in">
      
      {/* Top 3 Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl max-w-2xl">
        <button
          type="button"
          onClick={() => setCrmSubTab('customers')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            crmSubTab === 'customers'
              ? 'bg-[#111111] text-[#C5A059] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>قاعدة بيانات العملاء</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {Object.keys(customerMap).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCrmSubTab('abandoned')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            crmSubTab === 'abandoned'
              ? 'bg-[#111111] text-[#C5A059] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>السلات المتروكة</span>
          {unrecoveredCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
              {unrecoveredCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCrmSubTab('back_in_stock')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            crmSubTab === 'back_in_stock'
              ? 'bg-[#111111] text-[#C5A059] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>تنبيهات التوفر</span>
          {waitingCustomersCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
              {waitingCustomersCount}
            </span>
          )}
        </button>
      </div>

      {/* --- TAB 1: CUSTOMERS CRM --- */}
      {crmSubTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C5A059]" />
                  قاعدة بيانات العملاء وبرنامج الولاء (CRM & Loyalty)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  إجمالي العملاء في النظام: {Object.keys(customerMap).length} عميل · المطابقين للفلتر: {filteredCustomers.length}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleStartBulkSender}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مراسلة واتساب ({selectedCustomerPhones.size})</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>سحب البيانات (Excel)</span>
                </button>
              </div>
            </div>

            {/* Smart Filtering Strip */}
            <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">فلتر بالمنتج المشترى:</label>
                <select
                  value={smartProduct}
                  onChange={(e) => setSmartProduct(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">-- كل المنتجات --</option>
                  {Object.keys(catalog).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">فلتر بكود الخصم المستخدم:</label>
                <select
                  value={smartPromo}
                  onChange={(e) => setSmartPromo(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">-- كل الأكواد --</option>
                  {Object.keys(promoCodes).map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">نشاط العميل:</label>
                <select
                  value={smartActivity}
                  onChange={(e) => setSmartActivity(e.target.value as any)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="all">الكل</option>
                  <option value="active">🟢 عملاء نشطين (طلبوا مؤخراً)</option>
                  <option value="inactive">🔴 عملاء منقطعين (بحاجة لإعادة استهداف)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">ترتيب العملاء حسب:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSortMode('count')}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold ${
                      sortMode === 'count' ? 'bg-[#111111] text-[#C5A059] border-[#111111]' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    الأكثر طلباً
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortMode('newest')}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold ${
                      sortMode === 'newest' ? 'bg-[#111111] text-[#C5A059] border-[#111111]' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    الأحدث طلباً
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Text Search Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث باسم العميل..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث برقم الموبايل..."
                  value={filterPhone}
                  onChange={(e) => setFilterPhone(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث بالمحافظة / العنوان..."
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                />
                <span>تحديد الكل في هذه الصفحة ({filteredCustomers.length})</span>
              </label>
              <span className="text-xs text-gray-400">
                تم تحديد {selectedCustomerPhones.size} عميل
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#111111] text-white">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-[#C5A059]"
                      />
                    </th>
                    <th className="py-3 px-4 font-bold">العميل</th>
                    <th className="py-3 px-4 font-bold">رقم الهاتف</th>
                    <th className="py-3 px-4 font-bold">العنوان</th>
                    <th className="py-3 px-4 text-center font-bold">الطلبات المسلمة</th>
                    <th className="py-3 px-4 text-center font-bold">إجمالي المشتريات</th>
                    <th className="py-3 px-4 text-center font-bold">آخر طلب</th>
                    <th className="py-3 px-4 text-center font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        لا توجد نتائج مطابقة لشروط البحث والفلترة.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => {
                      const isSelected = selectedCustomerPhones.has(cust.originalPhone);
                      return (
                        <tr key={idx} className={`hover:bg-gray-50/60 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCustomer(cust.originalPhone)}
                              className="rounded text-[#C5A059]"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block">{cust.name}</span>
                            {cust.deliveredCount >= 3 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                                <Award className="w-3 h-3" />
                                <span>عميل VIP</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono" dir="ltr">{cust.originalPhone}</td>
                          <td className="py-3 px-4 max-w-xs truncate text-gray-600">{cust.address}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-700">{cust.deliveredCount}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-[#C5A059]">{cust.totalPaid.toFixed(0)} ج.م</td>
                          <td className="py-3 px-4 text-center text-gray-500 text-[11px]">{cust.latestDate.getTime() > 0 ? cust.latestDate.toLocaleDateString('ar-EG') : '---'}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                let p = cust.originalPhone.split('-')[0].replace(/\D/g, '');
                                if (p.startsWith('01') && p.length === 11) p = '2' + p;
                                window.open(`https://api.whatsapp.com/send?phone=${p}`, '_blank');
                              }}
                              className="p-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="محادثة واتساب مباشرة"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ABANDONED CARTS RECOVERY --- */}
      {crmSubTab === 'abandoned' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-red-500" />
                  استرجاع السلات المتروكة (Abandoned Cart Recovery)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  العملاء الذين وضعوا منتجات في السلة وأدخلوا أرقامهم دون إتمام الطلب.
                </p>
              </div>

              {/* Time threshold & promo code options */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs">
                  <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="font-semibold text-gray-600">كود الخصم التحفيزي:</span>
                  <input
                    type="text"
                    value={recoveryDiscountCode}
                    onChange={(e) => setRecoveryDiscountCode(e.target.value.toUpperCase())}
                    className="w-24 px-2 py-1 bg-white border border-gray-300 rounded font-mono font-bold text-center text-xs"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setAbandonedTimeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${abandonedTimeFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbandonedTimeFilter('30m')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${abandonedTimeFilter === '30m' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                  >
                    +30 دقيقة
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbandonedTimeFilter('1h')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${abandonedTimeFilter === '1h' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                  >
                    +ساعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbandonedTimeFilter('24h')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${abandonedTimeFilter === '24h' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                  >
                    +24 ساعة
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Abandoned Carts List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAbandonedCarts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white border border-gray-100 rounded-3xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">رائع! لا توجد سلات متروكة في الوقت الحالي</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  جميع العملاء الذين بدأوا الطلب أتموه بنجاح، أو لا توجد سلات تتطابق مع شرط الوقت المختار.
                </p>
              </div>
            ) : (
              filteredAbandonedCarts.map((cart) => {
                const cartDate = new Date(cart.updatedAt);
                const diffMinutes = Math.floor((now - cartDate.getTime()) / (1000 * 60));
                const timeAgoText = diffMinutes < 60 ? `منذ ${diffMinutes} دقيقة` : `منذ ${Math.floor(diffMinutes / 60)} ساعة`;

                return (
                  <div 
                    key={cart.id} 
                    className={`p-5 rounded-2xl border transition-all space-y-4 bg-white shadow-xs ${
                      cart.recovered ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 hover:border-[#C5A059]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">
                            {cart.customerName || 'عميل محتمل'}
                          </span>
                          {cart.recovered ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              تم الاسترجاع ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              متروكة
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-gray-600 mt-1 block" dir="ltr">
                          {cart.phone}
                        </span>
                      </div>

                      <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeAgoText}</span>
                      </span>
                    </div>

                    {/* Products summary */}
                    <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 block mb-1">المنتجات في السلة ({cart.items?.length || 0}):</span>
                      {(cart.items || []).map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-700">
                          <span className="truncate max-w-[180px]">• {it.name}</span>
                          <span className="font-mono text-gray-500">×{it.qty}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-xs">
                        <span>قيمة السلة:</span>
                        <span className="text-[#C5A059] font-mono">{cart.totalAmount.toFixed(0)} ج.م</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendAbandonedRecoveryWhatsApp(cart)}
                        className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="إرسال رسالة واتساب مع كود الخصم"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>استرجاع بالواتساب</span>
                      </button>

                      {onRecoverAbandonedCart && (
                        <button
                          type="button"
                          onClick={() => onRecoverAbandonedCart(cart.id)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            cart.recovered ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                          title={cart.recovered ? 'إلغاء التمييز كطلب مسترجع' : 'تمييز كطلب تم استرجاعه بنجاح'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {onDeleteAbandonedCart && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                              onDeleteAbandonedCart(cart.id);
                            }
                          }}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: BACK IN STOCK ALERTS --- */}
      {crmSubTab === 'back_in_stock' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  قائمة الانتظار وتنبيهات توفر المنتجات (Back-in-Stock Alerts)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  العملاء الذين طلبوا إشعارهم عبر الواتساب فور توفر المنتجات النافذة. بمجرد زيادة المخزون يمكنك إشعارهم بضغطة زر.
                </p>
              </div>
            </div>
          </div>

          {/* Grouped Product Waitlists */}
          <div className="space-y-4">
            {Object.keys(backInStockGrouped).length === 0 ? (
              <div className="py-16 text-center bg-white border border-gray-100 rounded-3xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">لا يوجد عملاء في قائمة الانتظار حالياً</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  عندما تنفد كمية أي منتج، سيتمكن العملاء من تسجيل أرقامهم في المتجر وستظهر طلباتهم هنا فوراً.
                </p>
              </div>
            ) : (
              Object.values(backInStockGrouped).map((group) => {
                const catItem = catalog[group.productKey];
                const currentStock = catItem?.stockQty || 0;
                const isNowInStock = !catItem?.isOutOfStock && currentStock > 0;
                const unnotifiedCount = group.requests.filter(r => !r.notified).length;

                return (
                  <div key={group.productKey} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={catItem?.image || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=150&q=80'}
                          alt={group.productName}
                          className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 font-brand">{group.productName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">المخزون الحالي:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                              isNowInStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}>
                              {isNowInStock ? `${currentStock} قطعة متوفرة ✓` : 'نفدت الكمية (0)'}
                            </span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-600 font-bold">
                              {group.requests.length} عميل في قائمة الانتظار
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bulk Notification Button */}
                      <button
                        type="button"
                        onClick={() => handleSendBackInStockBulkWhatsApp(group)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          isNowInStock
                            ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white animate-pulse'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        title="إرسال إشعار توفر لجميع العملاء المسجلين"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>إرسال إشعار توفر للجميع ({unnotifiedCount} بانتظار الإشعار)</span>
                      </button>
                    </div>

                    {/* Waiting Customers Sub-table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="py-2.5 px-3 font-semibold">العميل</th>
                            <th className="py-2.5 px-3 font-semibold">رقم الواتساب</th>
                            <th className="py-2.5 px-3 font-semibold">تاريخ التسجيل</th>
                            <th className="py-2.5 px-3 text-center font-semibold">حالة الإشعار</th>
                            <th className="py-2.5 px-3 text-center font-semibold">إجراء فردي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                          {group.requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50">
                              <td className="py-2.5 px-3 font-semibold">{req.customerName || 'عميل متجر'}</td>
                              <td className="py-2.5 px-3 font-mono" dir="ltr">{req.customerPhone}</td>
                              <td className="py-2.5 px-3 text-gray-500">{new Date(req.createdAt).toLocaleDateString('ar-EG')}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  req.notified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {req.notified ? 'تم الإشعار ✓' : 'في الانتظار ⏳'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    let cleanP = req.customerPhone.replace(/\D/g, '');
                                    if (cleanP.startsWith('01') && cleanP.length === 11) cleanP = '2' + cleanP;
                                    const msg = `مرحباً بكِ من R O S É E ✨ يسعدنا إعلامك بأن المنتج (${group.productName}) أصبح متوفراً الآن! يمكنكِ طلبه فوراً: https://rosee.eg`;
                                    window.open(`https://api.whatsapp.com/send?phone=${cleanP}&text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="p-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="مراسلة هذا العميل"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteBackInStockRequest && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteBackInStockRequest(req.id)}
                                    className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                    title="حذف من قائمة الانتظار"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Bulk WhatsApp Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                مراسلة العملاء المحددين ({bulkQueue.length} عميل)
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                نص الرسالة المرسلة لجميع العملاء:
              </label>
              <textarea
                rows={4}
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {currentBulkIndex < bulkQueue.length ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900">
                    العميل الحالي ({currentBulkIndex + 1} من {bulkQueue.length}):
                  </span>
                  <span className="font-mono text-emerald-700" dir="ltr">
                    {bulkQueue[currentBulkIndex].phone}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {bulkQueue[currentBulkIndex].name}
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleSendToCurrentBulk();
                      setCurrentBulkIndex(prev => prev + 1);
                    }}
                    className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال عبر واتساب لهذا العميل</span>
                  </button>

                  <button
                    onClick={() => setCurrentBulkIndex(prev => prev + 1)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    تخطي والانتقال للعميل التالي ⏭️
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <h4 className="text-base font-bold text-gray-900">تم الانتهاء من جميع العملاء المحددين!</h4>
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-6 py-2 bg-[#111111] text-white rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
