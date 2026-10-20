import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Printer, 
  Calendar, 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  FileText,
  X,
  TrendingDown,
  Copy,
  Download,
  Check,
  ShieldCheck,
  Clock,
  Coins,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { Order, Expense, ProductCatalog, PaymentStatus, OrderStatus } from '../../types';

interface AnalyticsManagerProps {
  orders: Order[];
  expenses: Expense[];
  catalog: ProductCatalog;
}

export const AnalyticsManager: React.FC<AnalyticsManagerProps> = ({
  orders = [],
  expenses = [],
  catalog = {}
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'quarter' | 'year'>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // ERP Accounting Ledger Filter & Search
  const [erpTabFilter, setErpTabFilter] = useState<'all' | 'cash_collected' | 'receivables' | 'advance_revenue' | 'realized'>('all');
  const [erpSearchQuery, setErpSearchQuery] = useState('');

  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Safe references
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeCatalog = catalog || {};

  // Time filter cutoff date calculation
  const getFilterDate = () => {
    const d = new Date();
    if (timeFilter === 'week') d.setDate(d.getDate() - 7);
    else if (timeFilter === 'month') d.setMonth(d.getMonth() - 1);
    else if (timeFilter === 'quarter') d.setMonth(d.getMonth() - 3);
    else if (timeFilter === 'year') d.setFullYear(d.getFullYear() - 1);
    else return new Date(0);
    return d;
  };

  const cutoffDate = getFilterDate();

  // Filter orders by date
  const periodOrders = safeOrders.filter(o => {
    if (o.archived) return false;
    const orderDate = o.date ? new Date(o.date) : new Date(0);
    return orderDate >= cutoffDate;
  });

  // Unique customer phones
  const uniqueCustomerPhones = new Set<string>();
  let totalRequestedPieces = 0;
  let piecesPending = 0;
  let piecesProcessing = 0;
  let piecesPackaged = 0;
  let piecesDelivered = 0;
  let piecesRejected = 0;

  periodOrders.forEach(o => {
    if (o.phone) {
      const cleanPhone = o.phone.split('-')[0].trim().replace(/\D/g, '');
      if (cleanPhone) uniqueCustomerPhones.add(cleanPhone);
    }
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach(i => {
      const q = Number(i.qty) || 0;
      totalRequestedPieces += q;
      if (o.status === 'pending') piecesPending += q;
      else if (o.status === 'processing') piecesProcessing += q;
      else if (o.status === 'packaged') piecesPackaged += q;
      else if (o.status === 'delivered') piecesDelivered += q;
      else if (o.status === 'rejected' || o.status === 'blocked') piecesRejected += q;
    });
  });

  // Cost lookup helper
  const getItemCost = (itemName: string) => {
    if (safeCatalog[itemName]?.cost !== undefined) {
      return Number(safeCatalog[itemName].cost) || 0;
    }
    const match = itemName.match(/^(.*?):\s*(.*?)\s*\((.*?)\)$/);
    if (match) {
      const base = match[2].trim().toLowerCase();
      for (const [k, v] of Object.entries(safeCatalog)) {
        if (k.toLowerCase().includes(base)) return Number(v.cost) || 0;
      }
    }
    return 0;
  };

  // Helper to compute precise order financials & ERP Accounting status
  const getOrderFinancials = (o: Order) => {
    const items = Array.isArray(o.items) ? o.items : [];
    let orderSubtotal = 0;
    let orderCost = 0;
    let orderQty = 0;

    items.forEach(i => {
      const price = Number(i.unitPrice) || 0;
      const qty = Number(i.qty) || 0;
      const unitCost = getItemCost(i.name);
      orderSubtotal += price * qty;
      orderCost += unitCost * qty;
      orderQty += qty;
    });

    const discVal = Number(o.discountVal) || 0;
    const discount = o.discountType === 'percent'
      ? orderSubtotal * (discVal / 100)
      : discVal;

    const netTotal = Math.max(0, orderSubtotal - discount);

    // Operational Status
    const opStatus = o.status;

    // Financial Payment Status (Fallback: if instapay was selected and not specified, consider paid, otherwise unpaid)
    const pStatus: PaymentStatus = o.paymentStatus || (o.paymentMethod === 'instapay' ? 'paid' : 'unpaid');
    
    // Deposit amount (capped to netTotal)
    const depositAmt = pStatus === 'deposit' ? Math.min(Number(o.depositAmount) || 0, netTotal) : 0;
    const remainingAmt = pStatus === 'paid' ? 0 : (pStatus === 'deposit' ? Math.max(0, netTotal - depositAmt) : netTotal);

    // 1. Actual Cash Collected (السيولة النقدية الفعلية بالخزنة)
    // Counts netTotal if paid, or depositAmt if deposit. Zero if unpaid.
    const cashCollected = pStatus === 'paid' ? netTotal : (pStatus === 'deposit' ? depositAmt : 0);

    // 2. Accounts Receivable (مستحقات ومديونيات للتحصيل - فلوس لينا بره)
    // Delivered orders where payment is unpaid (full netTotal) or deposit (remainingAmt).
    const isReceivable = opStatus === 'delivered' && (pStatus === 'unpaid' || (pStatus === 'deposit' && remainingAmt > 0));
    const receivableAmt = isReceivable ? (pStatus === 'unpaid' ? netTotal : remainingAmt) : 0;

    // 3. Unearned / Advance Revenue (إيرادات محصلة مقدماً / التزامات قيد التنفيذ)
    // Money received (paid or deposit) for orders that are NOT delivered yet.
    const isAdvance = opStatus !== 'delivered' && (pStatus === 'paid' || (pStatus === 'deposit' && depositAmt > 0));
    const advanceAmt = isAdvance ? (pStatus === 'paid' ? netTotal : depositAmt) : 0;

    // 4. Realized Net Profit (صافي الأرباح المحققة فعلياً)
    // Only counted when BOTH delivered AND paid in full!
    const isRealized = opStatus === 'delivered' && pStatus === 'paid';
    const realizedGrossProfit = isRealized ? (netTotal - orderCost) : 0;

    return {
      orderSubtotal,
      discount,
      netTotal,
      orderCost,
      orderQty,
      opStatus,
      pStatus,
      depositAmt,
      remainingAmt,
      cashCollected,
      isReceivable,
      receivableAmt,
      isAdvance,
      advanceAmt,
      isRealized,
      realizedGrossProfit
    };
  };

  // Evaluate all period orders under ERP Accounting standards
  let actualCashCollected = 0;
  let accountsReceivable = 0;
  let unearnedAdvanceRevenue = 0;
  let realizedGrossSales = 0;
  let realizedCOGS = 0;
  let totalDeliveredPiecesSold = 0;

  // Track product stats for delivered & realized orders
  const productStats: Record<string, { qty: number; revenue: number; cost: number }> = {};
  Object.keys(safeCatalog).forEach(p => {
    productStats[p] = { qty: 0, revenue: 0, cost: 0 };
  });

  const enrichedOrders = periodOrders.map(order => {
    const fin = getOrderFinancials(order);

    // Sum ERP totals (excluding rejected/blocked unless cash was already logged)
    if (order.status !== 'rejected' && order.status !== 'blocked') {
      actualCashCollected += fin.cashCollected;
      if (fin.isReceivable) accountsReceivable += fin.receivableAmt;
      if (fin.isAdvance) unearnedAdvanceRevenue += fin.advanceAmt;
      
      if (fin.isRealized) {
        realizedGrossSales += fin.netTotal;
        realizedCOGS += fin.orderCost;
        totalDeliveredPiecesSold += fin.orderQty;

        // Distribute to product stats
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach(i => {
          const itemPrice = Number(i.unitPrice) || 0;
          const itemQty = Number(i.qty) || 0;
          const unitCost = getItemCost(i.name);
          if (!productStats[i.name]) {
            productStats[i.name] = { qty: 0, revenue: 0, cost: 0 };
          }
          productStats[i.name].qty += itemQty;
          productStats[i.name].cost += unitCost * itemQty;
          if (fin.orderSubtotal > 0) {
            const lineTotal = itemPrice * itemQty;
            productStats[i.name].revenue += fin.netTotal * (lineTotal / fin.orderSubtotal);
          }
        });
      }
    }

    return {
      ...order,
      fin
    };
  });

  // Calculate expenses for the period
  const periodExpenses = safeExpenses.filter(e => {
    if (timeFilter === 'all') return true;
    const expDate = e.date ? new Date(e.date) : new Date(0);
    return expDate >= cutoffDate;
  });

  const totalOpexExpenses = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Realized Gross Profit & Net Profit (Strict ERP: Delivered + Paid)
  const realizedGrossProfit = Math.max(0, realizedGrossSales - realizedCOGS);
  const realizedNetProfit = realizedGrossProfit - totalOpexExpenses;

  // Group-level separate financial accounts
  const groupStats: Record<string, { qty: number; revenue: number; cost: number; productCount: number }> = {};
  Object.keys(safeCatalog).forEach(k => {
    const groupName = k.includes(':') ? k.split(':')[0].trim() : 'المجموعة الأساسية';
    if (!groupStats[groupName]) {
      groupStats[groupName] = { qty: 0, revenue: 0, cost: 0, productCount: 0 };
    }
    groupStats[groupName].productCount += 1;
  });

  Object.entries(productStats).forEach(([prodKey, stat]) => {
    const groupName = prodKey.includes(':') ? prodKey.split(':')[0].trim() : 'المجموعة الأساسية';
    if (!groupStats[groupName]) {
      groupStats[groupName] = { qty: 0, revenue: 0, cost: 0, productCount: 1 };
    }
    groupStats[groupName].qty += stat.qty;
    groupStats[groupName].revenue += stat.revenue;
    groupStats[groupName].cost += stat.cost;
  });

  const allGroupNames = Object.keys(groupStats);

  // Status counts for Doughnut chart
  const statusCounts = {
    pending: periodOrders.filter(o => o.status === 'pending').length,
    processing: periodOrders.filter(o => o.status === 'processing').length,
    packaged: periodOrders.filter(o => o.status === 'packaged').length,
    delivered: periodOrders.filter(o => o.status === 'delivered').length,
    rejected: periodOrders.filter(o => o.status === 'rejected' || o.status === 'blocked').length
  };

  // Re-render Chart.js graphs cleanly on data change
  useEffect(() => {
    let barChartInstance: Chart | null = null;
    let doughnutChartInstance: Chart | null = null;

    // 1. Render Bar Chart with ERP Financial Breakdown
    if (barCanvasRef.current) {
      const existingBar = Chart.getChart(barCanvasRef.current);
      if (existingBar) existingBar.destroy();

      const ctx = barCanvasRef.current.getContext('2d');
      if (ctx) {
        barChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [
              'السيولة الفعلية بالخزنة',
              'مستحقات للتحصيل (بره)',
              'إيرادات مقدمة (التزامات)',
              'تكلفة المحقق (COGS)',
              'المصروفات (OPEX)',
              'صافي الأرباح المحققة'
            ],
            datasets: [
              {
                label: 'القيمة (ج.م)',
                data: [
                  Math.round(actualCashCollected),
                  Math.round(accountsReceivable),
                  Math.round(unearnedAdvanceRevenue),
                  Math.round(realizedCOGS),
                  Math.round(totalOpexExpenses),
                  Math.round(realizedNetProfit)
                ],
                backgroundColor: [
                  '#10B981', // Cash: Emerald
                  '#F59E0B', // Receivables: Amber
                  '#3B82F6', // Advance: Blue
                  '#8B5CF6', // COGS: Purple
                  '#EF4444', // OPEX: Red
                  '#C5A059'  // Realized Net: Rosee Gold
                ],
                borderRadius: 8
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (val) => `${val} ج.م`
                }
              }
            }
          }
        });
      }
    }

    // 2. Render Doughnut Chart
    if (doughnutCanvasRef.current) {
      const existingDoughnut = Chart.getChart(doughnutCanvasRef.current);
      if (existingDoughnut) existingDoughnut.destroy();

      const ctx = doughnutCanvasRef.current.getContext('2d');
      if (ctx) {
        doughnutChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['معلق', 'قيد التنفيذ', 'تم التغليف', 'تم التوصيل', 'مرفوض/محظور'],
            datasets: [
              {
                data: [
                  statusCounts.pending,
                  statusCounts.processing,
                  statusCounts.packaged,
                  statusCounts.delivered,
                  statusCounts.rejected
                ],
                backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#14B8A6', '#EF4444'],
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  font: { size: 11, family: 'Cairo' }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (barChartInstance) barChartInstance.destroy();
      if (doughnutChartInstance) doughnutChartInstance.destroy();
    };
  }, [
    timeFilter,
    actualCashCollected,
    accountsReceivable,
    unearnedAdvanceRevenue,
    realizedCOGS,
    totalOpexExpenses,
    realizedNetProfit,
    statusCounts.pending,
    statusCounts.processing,
    statusCounts.packaged,
    statusCounts.delivered,
    statusCounts.rejected
  ]);

  const realizedGrossMarginPercent = realizedGrossSales > 0 
    ? ((realizedGrossProfit / realizedGrossSales) * 100).toFixed(1) 
    : '0';
  const realizedNetMarginPercent = realizedGrossSales > 0 
    ? ((realizedNetProfit / realizedGrossSales) * 100).toFixed(1) 
    : '0';

  const timeFilterLabels: Record<string, string> = {
    all: 'كامل الأوقات',
    week: 'أسبوعي (آخر 7 أيام)',
    month: 'شهري (آخر 30 يوماً)',
    quarter: 'ربع سنوي (آخر 3 أشهر)',
    year: 'سنوي (آخر عام)'
  };

  // Filtered list for ERP Accounting Table
  const filteredErpOrders = enrichedOrders.filter(o => {
    // 1. Tab Filter
    if (erpTabFilter === 'cash_collected' && o.fin.cashCollected <= 0) return false;
    if (erpTabFilter === 'receivables' && !o.fin.isReceivable) return false;
    if (erpTabFilter === 'advance_revenue' && !o.fin.isAdvance) return false;
    if (erpTabFilter === 'realized' && !o.fin.isRealized) return false;

    // 2. Search Query
    if (erpSearchQuery.trim()) {
      const q = erpSearchQuery.trim().toLowerCase();
      const matchId = (o.id || '').toLowerCase().includes(q);
      const matchName = (o.name || '').toLowerCase().includes(q);
      const matchPhone = (o.phone || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone) return false;
    }

    return true;
  });

  // Export to CSV function (with UTF-8 BOM for Arabic Excel)
  const handleExportCSV = () => {
    const headers = [
      'رقم الطلب',
      'تاريخ الطلب',
      'اسم العميل',
      'رقم الهاتف',
      'الحالة التشغيلية',
      'حالة الدفع المالية',
      'إجمالي الطلب (ج.م)',
      'السيولة المحصلة بالخزنة (ج.م)',
      'المتبقي للتحصيل (ج.م)',
      'تكلفة البضاعة (ج.م)',
      'الربح المحقق (ج.م)',
      'التصنيف المحاسبي ERP'
    ];

    const rows = filteredErpOrders.map(o => {
      let classification = 'عادي';
      if (o.fin.isRealized) classification = 'أرباح محققة بالكامل (مُسلّم + مدفوع)';
      else if (o.fin.isReceivable) classification = 'مستحقات للتحصيل (فلوس بره)';
      else if (o.fin.isAdvance) classification = 'إيرادات مقدمة (التزام قيد التنفيذ)';
      else if (o.fin.cashCollected > 0) classification = 'سيولة محصلة بالخزنة';

      const opLabels: Record<OrderStatus, string> = {
        pending: 'معلق',
        processing: 'قيد التنفيذ',
        packaged: 'تم التغليف',
        delivered: 'تم التوصيل',
        rejected: 'مرفوض',
        blocked: 'محظور'
      };

      const payLabels: Record<PaymentStatus, string> = {
        unpaid: 'لم يتم الدفع',
        deposit: `عربون (${o.fin.depositAmt})`,
        paid: 'مدفوع بالكامل'
      };

      return [
        `"${o.id}"`,
        `"${o.date || ''}"`,
        `"${o.name || ''}"`,
        `"${o.phone || ''}"`,
        `"${opLabels[o.status] || o.status}"`,
        `"${payLabels[o.fin.pStatus] || o.fin.pStatus}"`,
        o.fin.netTotal.toFixed(2),
        o.fin.cashCollected.toFixed(2),
        o.fin.remainingAmt.toFixed(2),
        o.fin.orderCost.toFixed(2),
        o.fin.realizedGrossProfit.toFixed(2),
        `"${classification}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rosee-erp-accounting-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-arabic text-gray-800">
      
      {/* Top Header Bar & Time Period Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-100 rounded-2xl p-6 shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C5A059]" />
            التقارير المالية والمحاسبية الدقيقة (ERP Accounting Logic)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            فصل تام بين الحالة التشغيلية للطلب وحالة الدفع المالية · إدارة دقيقة للسيولة بالخزنة، المستحقات بالخارج، والأرباح المحققة فعلياً.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white font-bold text-gray-800 focus:outline-none focus:border-[#C5A059]"
          >
            <option value="all">كل الأوقات</option>
            <option value="week">أسبوعي (7 أيام)</option>
            <option value="month">شهري (30 يوماً)</option>
            <option value="quarter">ربع سنوي (3 أشهر)</option>
            <option value="year">سنوي (12 شهراً)</option>
          </select>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>📄 تقرير مالي رسمي</span>
          </button>
        </div>
      </div>

      {/* Main ERP Financial KPIs (User Request: تقسيم المؤشرات إلى التصنيفات المحاسبية) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Actual Cash Collected (السيولة النقدية الفعلية بالخزنة) */}
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-white to-white border-2 border-emerald-500/30 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              السيولة الفعلية بالخزنة (Actual Cash)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              داخل الخزنة ✅
            </span>
          </div>
          <span className="text-2xl font-extrabold text-emerald-700 tabular-nums font-brand block">
            {Math.round(actualCashCollected).toLocaleString('en-US')} ج.م
          </span>
          <p className="text-[11px] text-gray-500 mt-2">
            تشمل الطلبات المسددة بالكامل (<strong className="text-emerald-700">paid</strong>) + قيمة العربون المدفوع فقط (<strong className="text-emerald-700">deposit</strong>).
          </p>
        </div>

        {/* 2. Accounts Receivable (مستحقات ومديونيات للتحصيل - فلوس لينا بره) */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-white to-white border-2 border-amber-500/30 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              مستحقات للتحصيل (Accounts Receivable)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              فلوس بره 🚚
            </span>
          </div>
          <span className="text-2xl font-extrabold text-amber-700 tabular-nums font-brand block">
            {Math.round(accountsReceivable).toLocaleString('en-US')} ج.م
          </span>
          <p className="text-[11px] text-gray-500 mt-2">
            طلبات تم توصيلها للعميل (<strong className="text-amber-800">delivered</strong>) ولكن لم تُسدد بالكامل بعد (في ذمة المناديب/الشركات).
          </p>
        </div>

        {/* 3. Unearned / Advance Revenue (إيرادات محصلة مقدماً / التزامات قيد التنفيذ) */}
        <div className="p-5 bg-gradient-to-br from-blue-500/10 via-white to-white border-2 border-blue-500/30 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              إيرادات مقدمة (Advance Revenue)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              التزام قيد التنفيذ ⏳
            </span>
          </div>
          <span className="text-2xl font-extrabold text-blue-700 tabular-nums font-brand block">
            {Math.round(unearnedAdvanceRevenue).toLocaleString('en-US')} ج.م
          </span>
          <p className="text-[11px] text-gray-500 mt-2">
            مبالغ محصلة مسبقاً (عربون أو دفع كامل) لطلبات ما زالت معلقة أو قيد التجهيز ولم تُسلم بعد.
          </p>
        </div>

        {/* 4. Realized Net Profit (صافي الأرباح المحققة فعلياً) */}
        <div className="p-5 bg-[#111111] text-white border-2 border-[#C5A059] rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C5A059] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C5A059]" />
              صافي الأرباح المحققة (Realized Profit)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/50">
              مُسلّم + مدفوع 🏆
            </span>
          </div>
          <span className="text-2xl font-extrabold text-[#C5A059] tabular-nums font-brand block">
            {Math.round(realizedNetProfit).toLocaleString('en-US')} ج.م
          </span>
          <p className="text-[11px] text-gray-400 mt-2">
            لا يُحسب الربح نهائياً إلا للطلبات التي تم تسليمها (<strong className="text-white">delivered</strong>) ودُفعت قيمتها بالكامل (<strong className="text-white">paid</strong>).
          </p>
        </div>

      </div>

      {/* Secondary Operational & Expense KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs text-center">
          <span className="text-[11px] font-bold text-gray-400 block mb-0.5">إجمالي الطلبات</span>
          <span className="text-lg font-bold text-gray-900 tabular-nums">{periodOrders.length}</span>
          <span className="text-[10px] text-gray-400 block">({uniqueCustomerPhones.size} عميل)</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs text-center">
          <span className="text-[11px] font-bold text-gray-400 block mb-0.5">القطع المطلوبة</span>
          <span className="text-lg font-bold text-purple-700 tabular-nums">{totalRequestedPieces}</span>
          <span className="text-[10px] text-gray-400 block">في كل المراحل</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs text-center">
          <span className="text-[11px] font-bold text-gray-400 block mb-0.5">القطع المحققة</span>
          <span className="text-lg font-bold text-teal-700 tabular-nums">{totalDeliveredPiecesSold}</span>
          <span className="text-[10px] text-teal-600 block font-semibold">مُسلّم ومدفوع</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs text-center">
          <span className="text-[11px] font-bold text-gray-400 block mb-0.5">تكلفة المحقق (COGS)</span>
          <span className="text-lg font-bold text-purple-600 tabular-nums">{Math.round(realizedCOGS)} ج.م</span>
          <span className="text-[10px] text-gray-400 block">تكلفة خامات وعبوات</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs text-center">
          <span className="text-[11px] font-bold text-gray-400 block mb-0.5">المصروفات (OPEX)</span>
          <span className="text-lg font-bold text-rose-600 tabular-nums">{Math.round(totalOpexExpenses)} ج.م</span>
          <span className="text-[10px] text-rose-600 block font-semibold">إعلانات ورواتب وشحن</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs text-center">
          <span className="text-[11px] font-bold text-gray-400 block mb-0.5">هامش صافي الربح</span>
          <span className="text-lg font-bold text-emerald-600 tabular-nums">{realizedNetMarginPercent}%</span>
          <span className="text-[10px] text-gray-400 block">إجمالي: {realizedGrossMarginPercent}%</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Flow Bar Chart */}
        <div className="lg:col-span-2 p-6 bg-white border border-gray-100 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>📊 التدفق المالي المحاسبي (ERP Flow)</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">بالجنيه المصري</span>
          </div>
          <div className="h-72 w-full relative">
            <canvas ref={barCanvasRef} />
          </div>
        </div>

        {/* Order Status Doughnut Chart */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            🍩 توزيع الحالات التشغيلية للطلبات
          </h3>
          <div className="h-72 w-full relative">
            <canvas ref={doughnutCanvasRef} />
          </div>
        </div>

      </div>

      {/* Interactive ERP Accounting Ledger & Filterable Table (User Request: إمكانية فلترتها وتصديرها) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#C5A059]" />
              دفتر القيود والتقارير المحاسبية التفصيلي (ERP Financial Ledger)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              جدول محاسبي مفصل لكل معاملة مالية مع إمكانية الفرز حسب التصنيف وتصدير ملف Excel / CSV بنقرة واحدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={erpSearchQuery}
                onChange={(e) => setErpSearchQuery(e.target.value)}
                placeholder="بحث برقم الطلب، العميل، الهاتف..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#C5A059]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="تصدير كود إكسل متوافق باللغة العربية"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setErpTabFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              erpTabFilter === 'all'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            الكل ({enrichedOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setErpTabFilter('cash_collected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              erpTabFilter === 'cash_collected'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>💵 السيولة الفعلية بالخزنة</span>
            <span className="opacity-90 font-mono">({enrichedOrders.filter(o => o.fin.cashCollected > 0).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setErpTabFilter('receivables')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              erpTabFilter === 'receivables'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>🚚 مستحقات للتحصيل (فلوس بره)</span>
            <span className="opacity-90 font-mono">({enrichedOrders.filter(o => o.fin.isReceivable).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setErpTabFilter('advance_revenue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              erpTabFilter === 'advance_revenue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <span>⏳ إيرادات مقدمة (التزامات)</span>
            <span className="opacity-90 font-mono">({enrichedOrders.filter(o => o.fin.isAdvance).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setErpTabFilter('realized')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              erpTabFilter === 'realized'
                ? 'bg-[#C5A059] text-white shadow-xs'
                : 'bg-amber-50 text-[#8C6D2D] hover:bg-amber-100 border border-[#C5A059]/40'
            }`}
          >
            <span>🏆 أرباح محققة بالكامل (مُسلّم + مدفوع)</span>
            <span className="opacity-90 font-mono">({enrichedOrders.filter(o => o.fin.isRealized).length})</span>
          </button>
        </div>

        {/* Accounting Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#111111] text-white font-bold">
              <tr>
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">العميل والهاتف</th>
                <th className="p-3 text-center">الحالة التشغيلية</th>
                <th className="p-3 text-center">حالة السداد المالية</th>
                <th className="p-3 text-center">إجمالي الطلب</th>
                <th className="p-3 text-center bg-emerald-950/40 text-emerald-300">المحصل بالخزنة</th>
                <th className="p-3 text-center bg-amber-950/40 text-amber-300">المتبقي للتحصيل</th>
                <th className="p-3 text-center bg-purple-950/40 text-purple-300">الربح المحقق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredErpOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    لا توجد معاملات مالية تطابق شروط التصفية المحددة.
                  </td>
                </tr>
              ) : (
                filteredErpOrders.map(o => {
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-bold font-brand text-gray-900 whitespace-nowrap">
                        #{o.id}
                      </td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {o.date ? new Date(o.date).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{o.name || 'عميل'}</div>
                        <div className="text-[11px] text-gray-400 font-mono" dir="ltr">{o.phone}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.status === 'delivered' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          o.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          o.status === 'processing' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          o.status === 'packaged' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {o.status === 'delivered' ? '🏁 تم التوصيل' :
                           o.status === 'pending' ? '🟡 معلق' :
                           o.status === 'processing' ? '🔵 قيد التنفيذ' :
                           o.status === 'packaged' ? '🟢 تم التغليف' :
                           o.status === 'rejected' ? '❌ مرفوض' : '⛔ محظور'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.fin.pStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          o.fin.pStatus === 'deposit' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          <span>{o.fin.pStatus === 'paid' ? '🟢' : o.fin.pStatus === 'deposit' ? '🟡' : '🔴'}</span>
                          <span>
                            {o.fin.pStatus === 'paid' ? 'مدفوع بالكامل' :
                             o.fin.pStatus === 'deposit' ? `عربون (${o.fin.depositAmt.toFixed(0)})` :
                             'غير مدفوع (COD)'}
                          </span>
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums text-gray-900">
                        {o.fin.netTotal.toFixed(0)} ج.م
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums text-emerald-700 bg-emerald-50/30">
                        {o.fin.cashCollected > 0 ? `${o.fin.cashCollected.toFixed(0)} ج.م` : '0 ج.م'}
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums text-amber-700 bg-amber-50/30">
                        {o.fin.remainingAmt > 0 ? `${o.fin.remainingAmt.toFixed(0)} ج.م` : '0 ج.م'}
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums bg-purple-50/30">
                        {o.fin.isRealized ? (
                          <span className="text-emerald-700">+{o.fin.realizedGrossProfit.toFixed(0)} ج.م</span>
                        ) : (
                          <span className="text-gray-400 text-[11px] font-normal">غير محقق بعد</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group-Level Financial Accounts Section (User Request: حسابات منفصلة لكل مجموعة) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-base">💼</span>
              <span>حسابات وتقارير المجموعات المنفصلة (Group Financial Accounts)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              كل مجموعة منتجات لها حساباتها المستقلة (المبيعات المحققة، تكلفة الخامات، والأرباح الصافية) لتحديد أداء كل خط إنتاج
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">تصفية العرض:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="p-2 text-xs border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-800 focus:outline-none focus:border-[#C5A059]"
            >
              <option value="all">كافة المجموعات ({allGroupNames.length})</option>
              {allGroupNames.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Group KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allGroupNames
            .filter(g => selectedGroupFilter === 'all' || selectedGroupFilter === g)
            .map(groupName => {
              const stat = groupStats[groupName];
              const groupProfit = stat.revenue - stat.cost;
              const groupMargin = stat.revenue > 0 ? ((groupProfit / stat.revenue) * 100).toFixed(1) : '0';
              const profitShare = realizedGrossProfit > 0 && groupProfit > 0 
                ? ((groupProfit / realizedGrossProfit) * 100).toFixed(1) 
                : '0';

              return (
                <div 
                  key={groupName}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    selectedGroupFilter === groupName 
                      ? 'border-[#C5A059] bg-amber-50/40 shadow-xs' 
                      : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                      {groupName}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {stat.productCount} أصناف
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="text-gray-500 block text-[10px]">مبيعات المجموعة المحققة</span>
                      <span className="font-bold text-gray-900 text-sm tabular-nums">
                        {stat.revenue.toFixed(0)} ج.م
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="text-gray-500 block text-[10px]">تكلفة خاماتها</span>
                      <span className="font-bold text-amber-700 text-sm tabular-nums">
                        {stat.cost.toFixed(0)} ج.م
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="text-gray-500 block text-[10px]">صافي ربح المجموعة</span>
                      <span className="font-bold text-emerald-600 text-sm tabular-nums">
                        {groupProfit.toFixed(0)} ج.م
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="text-gray-500 block text-[10px]">القطع المحققة</span>
                      <span className="font-bold text-blue-600 text-sm tabular-nums">
                        {stat.qty} قطعة
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-gray-200/60 font-semibold">
                    <span>هامش الربح: <strong className="text-emerald-700">{groupMargin}%</strong></span>
                    <span>المساهمة في الأرباح: <strong className="text-[#C5A059]">{profitShare}%</strong></span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Printable / Downloadable Formal Financial Statement Modal (Updated with ERP logic) */}
      {isReportModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReportModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-arabic animate-fade-in overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            id="printableFinancialReport"
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-8 p-8 cursor-default max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">
                  معاينة التقرير المالي الرسمي (ERP Standard)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 1. Print */}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const printContent = document.getElementById('printableFinancialReport');
                      if (!printContent) return;
                      const cloned = printContent.cloneNode(true) as HTMLElement;
                      const controls = cloned.querySelector('.print\\:hidden');
                      if (controls) controls.remove();

                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html dir="rtl" lang="ar">
                          <head>
                            <meta charset="utf-8" />
                            <title>تقرير مالي رسمي ERP - ROSÉE</title>
                            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
                            <style>
                              body { font-family: 'Cairo', sans-serif; padding: 24px; color: #111; direction: rtl; }
                              table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                              th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 11px; text-align: right; }
                              th { background-color: #f3f4f6; font-weight: bold; }
                              .text-center { text-align: center; }
                              .font-bold { font-weight: bold; }
                              @media print { body { padding: 0; } }
                            </style>
                          </head>
                          <body>
                            ${cloned.innerHTML}
                            <script>
                              window.onload = function() {
                                window.focus();
                                window.print();
                              };
                            </script>
                          </body>
                          </html>
                        `);
                        printWindow.document.close();
                      } else {
                        window.print();
                      }
                    } catch (err) {
                      window.print();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>🖨️ طباعة التقرير</span>
                </button>

                {/* 2. Download HTML file */}
                <button
                  type="button"
                  onClick={() => {
                    const printContent = document.getElementById('printableFinancialReport');
                    if (!printContent) return;
                    const cloned = printContent.cloneNode(true) as HTMLElement;
                    const controls = cloned.querySelector('.print\\:hidden');
                    if (controls) controls.remove();

                    const htmlDoc = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <title>تقرير مالي شامل ERP - ROSÉE</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Cairo', sans-serif; padding: 32px; max-width: 900px; margin: 0 auto; color: #111; direction: rtl; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 12px; text-align: right; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${cloned.innerHTML}
</body>
</html>`;

                    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rosee-erp-report-${new Date().toISOString().split('T')[0]}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>تنزيل التقرير</span>
                </button>

                {/* 3. Copy Summary */}
                <button
                  type="button"
                  onClick={() => {
                    const text = `📊 تقرير مالي محاسبي معتمد (ERP) - ROSÉE
تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}
عن الفترة: ${timeFilterLabels[timeFilter]}

1. المؤشرات المحاسبية الأساسية:
- السيولة النقدية الفعلية بالخزنة: ${actualCashCollected.toFixed(0)} ج.م
- مستحقات ومديونيات للتحصيل (فلوس بره): ${accountsReceivable.toFixed(0)} ج.م
- إيرادات محصلة مقدماً (التزامات قيد التنفيذ): ${unearnedAdvanceRevenue.toFixed(0)} ج.م
- صافي الأرباح المحققة فعلياً (مُسلّم + مدفوع): ${realizedNetProfit.toFixed(0)} ج.م

2. قائمة الأرباح المحققة:
- المبيعات المحققة: ${realizedGrossSales.toFixed(0)} ج.م
- تكلفة البضاعة المحققة (COGS): ${realizedCOGS.toFixed(0)} ج.م
- المصروفات التشغيلية (OPEX): ${totalOpexExpenses.toFixed(0)} ج.م
- هامش الربح الصافي المحقق: ${realizedNetMarginPercent}%
`;
                    navigator.clipboard.writeText(text);
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'تم النسخ!' : 'نسخ الملخص'}</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corporate Letterhead */}
            <div className="flex justify-between items-start pb-6 border-b-2 border-[#C5A059]">
              <div>
                <h1 className="text-3xl font-brand font-bold tracking-[0.2em] text-[#111111]">R O S É E</h1>
                <p className="text-xs text-[#C5A059] uppercase tracking-wider font-brand font-semibold">Luxury Beauty & Care · Financial ERP</p>
              </div>
              <div className="text-left text-xs text-gray-500">
                <p><strong>تاريخ الإصدار:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
                <p><strong>عن الفترة:</strong> {timeFilterLabels[timeFilter]}</p>
              </div>
            </div>

            <div className="text-center my-6">
              <h2 className="text-xl font-bold text-gray-900">التقرير المالي والمحاسبي المعتمد (ERP Accounting Statement)</h2>
            </div>

            {/* 1. ERP Core Categories Summary */}
            <div className="my-6 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-r-4 border-[#C5A059] pr-2">
                1. تصنيفات السيولة والأرباح والمستحقات (ERP Balance Overview)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl text-xs">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[11px]">السيولة الفعلية بالخزنة</span>
                  <span className="font-bold text-base text-emerald-600 tabular-nums">{actualCashCollected.toFixed(2)} ج.م</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[11px]">مستحقات للتحصيل (فلوس بره)</span>
                  <span className="font-bold text-base text-amber-600 tabular-nums">{accountsReceivable.toFixed(2)} ج.م</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[11px]">إيرادات مقدمة (التزامات)</span>
                  <span className="font-bold text-base text-blue-600 tabular-nums">{unearnedAdvanceRevenue.toFixed(2)} ج.م</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[11px]">صافي الأرباح المحققة</span>
                  <span className="font-bold text-base text-[#8C6D2D] tabular-nums">{realizedNetProfit.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>

            {/* 2. Realized Income Statement */}
            <div className="my-6 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-r-4 border-[#C5A059] pr-2">
                2. قائمة الدخل المحققة فعلياً (Realized P&L: Delivered & Paid Only)
              </h3>
              <table className="w-full text-right text-xs border border-gray-200">
                <thead className="bg-[#111111] text-white">
                  <tr>
                    <th className="p-2.5">البند المحاسبي</th>
                    <th className="p-2.5 text-center">القيمة (ج.م)</th>
                    <th className="p-2.5">الملاحظات والشروط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-2.5 font-semibold">المبيعات المحققة (Delivered & Paid)</td>
                    <td className="p-2.5 text-center font-bold tabular-nums">{realizedGrossSales.toFixed(2)}</td>
                    <td className="p-2.5 text-gray-400">فقط الطلبات المسلمة والمسددة 100%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-red-600">تكلفة البضاعة المباعة للطلبات المحققة (COGS)</td>
                    <td className="p-2.5 text-center text-red-600 font-bold tabular-nums">({realizedCOGS.toFixed(2)})</td>
                    <td className="p-2.5 text-gray-400">تكلفة الخامات والعبوات الفعلية</td>
                  </tr>
                  <tr className="bg-amber-50/50 font-bold">
                    <td className="p-2.5 text-gray-900">إجمالي الربح المحقق (Realized Gross Profit)</td>
                    <td className="p-2.5 text-center text-[#8C6D2D] tabular-nums">{realizedGrossProfit.toFixed(2)}</td>
                    <td className="p-2.5 text-[#8C6D2D]">هامش الربح {realizedGrossMarginPercent}%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-red-600">المصروفات التشغيلية (OPEX)</td>
                    <td className="p-2.5 text-center text-red-600 font-bold tabular-nums">({totalOpexExpenses.toFixed(2)})</td>
                    <td className="p-2.5 text-gray-400">إعلانات ممولة، رواتب وشحن</td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold">
                    <td className="p-2.5 text-emerald-800">صافي الربح النهائي المحقق (Realized Net Profit)</td>
                    <td className="p-2.5 text-center text-emerald-800 tabular-nums">{realizedNetProfit.toFixed(2)}</td>
                    <td className="p-2.5 text-emerald-800">هامش صافي {realizedNetMarginPercent}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Group Accounts Breakdown */}
            <div className="my-6 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-r-4 border-[#C5A059] pr-2">
                3. تفصيل الحسابات والأرباح لكل مجموعة منتجات
              </h3>
              <table className="w-full text-right text-xs border border-gray-200">
                <thead className="bg-gray-100 text-gray-800">
                  <tr>
                    <th className="p-2.5">المجموعة</th>
                    <th className="p-2.5 text-center">القطع المحققة</th>
                    <th className="p-2.5 text-center">المبيعات المحققة (ج.م)</th>
                    <th className="p-2.5 text-center">تكلفة الخامات</th>
                    <th className="p-2.5 text-center">صافي ربح المجموعة</th>
                    <th className="p-2.5 text-center">هامش الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allGroupNames.map(g => {
                    const st = groupStats[g];
                    const gProfit = st.revenue - st.cost;
                    const gMargin = st.revenue > 0 ? ((gProfit / st.revenue) * 100).toFixed(1) : '0';
                    return (
                      <tr key={g}>
                        <td className="p-2.5 font-bold text-gray-900">{g}</td>
                        <td className="p-2.5 text-center font-bold text-blue-600">{st.qty}</td>
                        <td className="p-2.5 text-center tabular-nums font-bold">{st.revenue.toFixed(0)}</td>
                        <td className="p-2.5 text-center tabular-nums text-red-500">{st.cost.toFixed(0)}</td>
                        <td className="p-2.5 text-center tabular-nums font-bold text-emerald-600">{gProfit.toFixed(0)}</td>
                        <td className="p-2.5 text-center font-bold text-gray-700">{gMargin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-8 mt-8 border-t border-gray-200 text-center text-xs text-gray-400">
              <p>R O S É E · نظام الإدارة المالية المحاسبي المتكامل والتقارير التنفيذية</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
