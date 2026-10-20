import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp, Calendar, FileText } from 'lucide-react';
import { Expense, Order, ProductCatalog } from '../../types';

interface ExpensesManagerProps {
  expenses: Expense[];
  orders: Order[];
  catalog: ProductCatalog;
  onAddExpense: (expense: Expense) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  orders,
  catalog,
  onAddExpense,
  onDeleteExpense
}) => {
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Financial calculations from delivered orders
  let totalDeliveredRevenue = 0;
  let totalCostOfGoods = 0;

  orders.filter(o => o.status === 'delivered' && !o.archived).forEach(order => {
    let sub = 0;
    let cost = 0;
    (order.items || []).forEach(item => {
      const price = Number(item.unitPrice) || 0;
      const unitCost = catalog[item.name]?.cost || 0;
      sub += price * (Number(item.qty) || 0);
      cost += unitCost * (Number(item.qty) || 0);
    });

    const disc = order.discountType === 'percent'
      ? sub * (order.discountVal / 100)
      : (order.discountVal || 0);

    totalDeliveredRevenue += Math.max(0, sub - disc);
    totalCostOfGoods += cost;
  });

  const totalOpexExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalDeliveredRevenue - totalCostOfGoods;
  const netProfitAfterExpenses = grossProfit - totalOpexExpenses;

  // Separate financial accounts per product group (User Request)
  const groupProfits: Record<string, { revenue: number; cost: number; profit: number; itemsSold: number }> = {};
  
  // Discover all groups from catalog
  Object.keys(catalog).forEach(k => {
    const gName = k.includes(':') ? k.split(':')[0].trim() : 'المجموعة الأساسية';
    if (!groupProfits[gName]) {
      groupProfits[gName] = { revenue: 0, cost: 0, profit: 0, itemsSold: 0 };
    }
  });

  orders.filter(o => o.status === 'delivered' && !o.archived).forEach(order => {
    (order.items || []).forEach(item => {
      const gName = item.name.includes(':') ? item.name.split(':')[0].trim() : 'المجموعة الأساسية';
      if (!groupProfits[gName]) {
        groupProfits[gName] = { revenue: 0, cost: 0, profit: 0, itemsSold: 0 };
      }
      const p = (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
      const c = (catalog[item.name]?.cost || 0) * (Number(item.qty) || 0);
      groupProfits[gName].revenue += p;
      groupProfits[gName].cost += c;
      groupProfits[gName].profit += (p - c);
      groupProfits[gName].itemsSold += (Number(item.qty) || 0);
    });
  });

  const allGroupNames = Object.keys(groupProfits);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال اسم البند والمبلغ بشكل صحيح.');
      return;
    }

    setIsAdding(true);
    try {
      const newExp: Expense = {
        id: `EXP-${Date.now()}`,
        title: expTitle.trim(),
        amount: amt,
        date: expDate || new Date().toISOString().split('T')[0],
        notes: expNotes.trim() || undefined
      };
      await onAddExpense(newExp);
      setExpTitle('');
      setExpAmount('');
      setExpNotes('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-right space-y-1">
          <span className="text-xs font-semibold text-gray-500">إجمالي المبيعات المنفذة</span>
          <p className="text-xl font-bold text-gray-900 tabular-nums font-brand">
            {totalDeliveredRevenue.toFixed(0)} ج.م
          </p>
          <span className="text-[11px] text-emerald-600 block">الإيرادات الفعلية</span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-right space-y-1">
          <span className="text-xs font-semibold text-gray-500">تكلفة البضاعة المباعة (COGS)</span>
          <p className="text-xl font-bold text-amber-700 tabular-nums font-brand">
            {totalCostOfGoods.toFixed(0)} ج.م
          </p>
          <span className="text-[11px] text-gray-400 block">تكلفة خامات وزيوت العطور</span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-right space-y-1">
          <span className="text-xs font-semibold text-gray-500">المصروفات التشغيلية (OPEX)</span>
          <p className="text-xl font-bold text-red-600 tabular-nums font-brand">
            {totalOpexExpenses.toFixed(0)} ج.م
          </p>
          <span className="text-[11px] text-red-500 block">إعلانات، رواتب وتغليف</span>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#111111] to-[#252525] text-white rounded-2xl shadow-md text-right space-y-1 border border-[#C5A059]/30">
          <span className="text-xs font-semibold text-[#C5A059]">صافي الأرباح الحقيقي (Net Profit)</span>
          <p className="text-2xl font-bold text-[#C5A059] tabular-nums font-brand">
            {netProfitAfterExpenses.toFixed(0)} ج.م
          </p>
          <span className="text-[11px] text-white/70 block">الأرباح الصافية بعد كافة التكاليف</span>
        </div>

      </div>

      {/* Group Financial Contributions (User Request: حسابات منفصلة لكل مجموعة في المصروفات والأرباح) */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>💼</span>
              <span>مساهمة وأرباح كل مجموعة منفصلة في تغطية المصروفات التشغيلية</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              حسابات مستقلة لكل مجموعة: الإيرادات، التكلفة المباشرة، وصافي أرباح المجموعة
            </p>
          </div>
          <span className="text-xs text-gray-500 font-bold">{allGroupNames.length} مجموعات نشطة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          {allGroupNames.map(g => {
            const st = groupProfits[g];
            const margin = st.revenue > 0 ? ((st.profit / st.revenue) * 100).toFixed(0) : '0';
            return (
              <div key={g} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 truncate">{g}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">
                    {st.itemsSold} قطعة
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-gray-600">
                    <span>المبيعات:</span>
                    <strong className="text-gray-900 tabular-nums">{st.revenue.toFixed(0)} ج.م</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>تكلفة الخامات:</span>
                    <span className="text-amber-700 font-semibold tabular-nums">{st.cost.toFixed(0)} ج.م</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
                    <span className="text-emerald-800">أرباح المجموعة:</span>
                    <span className="text-emerald-700 tabular-nums font-brand">{st.profit.toFixed(0)} ج.م</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 block text-left">هامش ربح: {margin}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Expense Form */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          ➕ تسجيل مصروف تشغيلي جديد
        </h3>

        <form onSubmit={handleCreateExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">بند المصروف *</label>
            <input
              type="text"
              required
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="مثال: إعلانات تيك توك، رواتب، كراتين شحن"
              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">المبلغ (ج.م) *</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">التاريخ *</label>
            <input
              type="date"
              required
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-2.5 px-4 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isAdding ? 'جاري الحفظ...' : 'حفظ المصروف'}
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">سجل المصروفات التشغيلية</h3>
          <span className="text-xs text-gray-500">{expenses.length} بنود مسجلة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b border-gray-100">
                <th className="py-3 px-4 font-bold">التاريخ</th>
                <th className="py-3 px-4 font-bold">البند</th>
                <th className="py-3 px-4 font-bold text-center">المبلغ</th>
                <th className="py-3 px-4 font-bold">ملاحظات</th>
                <th className="py-3 px-4 font-bold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    لم يتم تسجيل أي مصروفات تشغيلية بعد.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-500 font-mono">{exp.date}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{exp.title}</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600 tabular-nums font-brand">
                      {exp.amount.toFixed(2)} ج.م
                    </td>
                    <td className="py-3 px-4 text-gray-500">{exp.notes || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          onDeleteExpense(exp.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
