import React, { useState, useEffect } from 'react';
import { 
  Store, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  DEFAULT_DATABASE, 
  subscribeToRoseeData, 
  saveRoseeData 
} from './lib/firebase';
import { RoseeDatabase, Order, CustomerReview, PromoCode, AbandonedCart, BackInStockRequest, OrderItem } from './types';
import { Storefront } from './components/store/Storefront';
import { CartDrawer } from './components/store/CartDrawer';
import { OrderTrackingModal } from './components/store/OrderTrackingModal';
import { InvoiceModal } from './components/store/InvoiceModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ResetPasswordView } from './components/auth/ResetPasswordView';

export default function App() {
  const getInitialMode = (): 'store' | 'admin' | 'reset-password' => {
    if (typeof window === 'undefined') return 'store';
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('reset-password') || search.includes('token=') || hash.includes('token=')) {
      return 'reset-password';
    }
    return (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') ? 'admin' : 'store';
  };

  const [data, setData] = useState<RoseeDatabase>(DEFAULT_DATABASE);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'store' | 'admin' | 'reset-password'>(getInitialMode);

  // Storefront UI states
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [completedOrderForInvoice, setCompletedOrderForInvoice] = useState<Order | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    const unsubscribe = subscribeToRoseeData((updatedData) => {
      setData(updatedData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateCartQty = (key: string, qty: number) => {
    const next = { ...cart };
    if (qty <= 0) {
      delete next[key];
    } else {
      next[key] = qty;
    }
    setCart(next);
  };

  const handleClearCart = () => {
    setCart({});
    setEditingOrderId(null);
  };

  const handleSaveData = async (updatedData: RoseeDatabase) => {
    setData(updatedData);
    await saveRoseeData(updatedData);
  };

  const handleSaveOrderFromStore = async (
    order: Order,
    updatedPromo?: { code: string; promo: PromoCode }
  ) => {
    const isEdit = Boolean(editingOrderId);
    let updatedOrders = [...data.orders];

    if (isEdit) {
      const idx = updatedOrders.findIndex(o => o.id === editingOrderId);
      if (idx >= 0) {
        updatedOrders[idx] = order;
      } else {
        updatedOrders.unshift(order);
      }
    } else {
      updatedOrders.unshift(order);
    }

    // Decrement stock if item has showStock enabled
    const updatedCatalog = { ...data.catalog };
    order.items.forEach(item => {
      const catItem = updatedCatalog[item.name];
      if (catItem && catItem.showStock && catItem.stockQty !== undefined) {
        catItem.stockQty = Math.max(0, catItem.stockQty - item.qty);
      }
    });

    const updatedPromos = { ...data.promoCodes };
    if (updatedPromo) {
      updatedPromos[updatedPromo.code] = updatedPromo.promo;
    }

    // Mark customer abandoned carts as recovered
    const cleanPhone = (order.phone || order.customerPhone || '').replace(/\D/g, '').trim();
    const updatedAbandonedCarts = (data.abandonedCarts || []).map(cart => {
      if (cleanPhone && (cart.phone === cleanPhone || cart.customerPhone === cleanPhone) && !cart.recovered) {
        return { ...cart, recovered: true, updatedAt: new Date().toISOString() };
      }
      return cart;
    });

    const newLogs = [
      {
        timestamp: new Date().toISOString(),
        user: 'العميل/المتجر',
        action: isEdit ? `تعديل طلب برقم #${order.id}` : `استلام طلب إلكتروني جديد برقم #${order.id}`
      },
      ...(data.systemLogs || [])
    ].slice(0, 500);

    const fullUpdated: RoseeDatabase = {
      ...data,
      orders: updatedOrders,
      catalog: updatedCatalog,
      promoCodes: updatedPromos,
      abandonedCarts: updatedAbandonedCarts,
      systemLogs: newLogs
    };

    await handleSaveData(fullUpdated);
  };

  // Abandoned Cart Auto-capture Handler
  const handleRecordAbandonedCart = async (cartData: { phone: string; customerName?: string; items: OrderItem[]; totalAmount: number }) => {
    const cleanPhone = cartData.phone.replace(/\D/g, '').trim();
    if (cleanPhone.length < 8) return;

    const existingList = data.abandonedCarts || [];
    const matchIdx = existingList.findIndex(c => (c.phone === cleanPhone || c.customerPhone === cleanPhone) && !c.recovered);

    const now = new Date().toISOString();
    const cartRecord: AbandonedCart = {
      id: matchIdx >= 0 ? existingList[matchIdx].id : `AB-${Date.now()}`,
      phone: cleanPhone,
      customerPhone: cleanPhone,
      customerName: cartData.customerName || (matchIdx >= 0 ? existingList[matchIdx].customerName : 'عميل غير مسجل'),
      items: cartData.items,
      totalAmount: cartData.totalAmount,
      updatedAt: now,
      createdAt: matchIdx >= 0 ? (existingList[matchIdx].createdAt || existingList[matchIdx].updatedAt) : now,
      recovered: false
    };

    let updatedList = [...existingList];
    if (matchIdx >= 0) {
      updatedList[matchIdx] = cartRecord;
    } else {
      updatedList.unshift(cartRecord);
    }

    await handleSaveData({
      ...data,
      abandonedCarts: updatedList
    });
  };

  // Back In Stock Notification Request Handler
  const handleRecordBackInStock = async (request: { productKey: string; productName: string; customerPhone: string }) => {
    const cleanPhone = request.customerPhone.replace(/\D/g, '').trim();
    if (cleanPhone.length < 8) return;

    const existingList = data.backInStockRequests || [];
    const alreadyExists = existingList.some(r => r.productKey === request.productKey && r.customerPhone === cleanPhone && !r.notified);
    if (alreadyExists) return;

    const now = new Date().toISOString();
    const newReq: BackInStockRequest = {
      id: `BIS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productKey: request.productKey,
      productName: request.productName,
      customerPhone: cleanPhone,
      createdAt: now,
      requestedAt: now,
      notified: false
    };

    await handleSaveData({
      ...data,
      backInStockRequests: [newReq, ...existingList]
    });
  };

  // Claim Promo Code from Spin Wheel or Treasure Hunt
  const handleClaimPromoCode = (code: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
  };

  const handleStartEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    const newCart: { [key: string]: number } = {};
    order.items.forEach(i => {
      newCart[i.name] = i.qty;
    });
    setCart(newCart);
    setIsCartOpen(true);
  };

  const handleSubmitReview = async (review: CustomerReview) => {
    const revId = `REV-${Date.now()}`;
    const cleanReview: CustomerReview = {
      customerName: review.customerName || 'عميل',
      phone: review.phone || '',
      productName: review.productName || 'عطور ومستحضرات Rosée',
      rating: review.rating || 5,
      text: review.text || '',
      status: review.status || 'pending',
      date: review.date || new Date().toISOString(),
      ...(review.image ? { image: review.image } : {})
    };
    const updatedReviews = {
      ...(data.reviews || {}),
      [revId]: cleanReview
    };
    await handleSaveData({
      ...data,
      reviews: updatedReviews
    });
  };

  const pendingOrdersCount = data.orders.filter((o: Order) => !o.archived && o.status === 'pending').length;

  const switchMode = (mode: 'store' | 'admin') => {
    setActiveMode(mode);
    if (typeof window !== 'undefined') {
      if (mode === 'admin') {
        window.history.pushState(null, '', '/admin');
      } else {
        window.history.pushState(null, '', '/');
      }
    }
  };

  // Synchronize with URL path and hash changes (/admin vs /)
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('reset-password') || search.includes('token=') || hash.includes('token=')) {
        setActiveMode('reset-password');
      } else if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
        setActiveMode('admin');
      } else {
        setActiveMode('store');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [activeMode]);

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#111111] font-arabic">
      
      {/* Main Mode Renderer: Completely separate URLs & views */}
      {activeMode === 'reset-password' ? (
        <ResetPasswordView
          data={data}
          onSaveData={handleSaveData}
          onNavigateToAdmin={() => switchMode('admin')}
        />
      ) : activeMode === 'store' ? (
        <>
          <Storefront
            catalog={data.catalog}
            settings={data.settings}
            globalAlert={data.globalAlert}
            offers={data.offers}
            reels={data.reels}
            collections={data.collections}
            reviews={data.reviews}
            cart={cart}
            onUpdateCartQty={handleUpdateCartQty}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenTracking={() => setIsTrackingOpen(true)}
            onOpenAdmin={() => switchMode('admin')}
            onSubmitReview={handleSubmitReview}
            onRecordBackInStock={handleRecordBackInStock}
            onClaimPromoCode={handleClaimPromoCode}
          />

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => {
              setIsCartOpen(false);
              setEditingOrderId(null);
            }}
            cart={cart}
            catalog={data.catalog}
            promoCodes={data.promoCodes}
            settings={data.settings}
            onUpdateQty={handleUpdateCartQty}
            onClearCart={handleClearCart}
            onOrderSuccess={(order) => {
              setIsCartOpen(false);
              setCompletedOrderForInvoice(order);
            }}
            existingOrders={data.orders}
            onSaveOrderToDb={handleSaveOrderFromStore}
            editingOrderId={editingOrderId}
            onRecordAbandonedCart={handleRecordAbandonedCart}
          />

          <OrderTrackingModal
            isOpen={isTrackingOpen}
            onClose={() => setIsTrackingOpen(false)}
            orders={data.orders || []}
            loyaltyPointValue={data.settings?.loyaltyPointValue || 1}
            onEditOrder={handleStartEditOrder}
            onSubmitReview={handleSubmitReview}
          />

          <InvoiceModal
            order={completedOrderForInvoice}
            brandWhatsApp={data.settings?.socialLinks?.whatsapp || '201117237246'}
            onClose={() => setCompletedOrderForInvoice(null)}
          />
        </>
      ) : (
        <AdminDashboard
          data={data}
          onSaveData={handleSaveData}
          onSwitchToStore={() => switchMode('store')}
        />
      )}

    </div>
  );
}
