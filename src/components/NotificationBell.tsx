import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Package, X } from 'lucide-react';
import { Order } from '../types';

interface NotificationBellProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  orders,
  onSelectOrder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenTime, setLastSeenTime] = useState<number>(() => {
    return parseInt(localStorage.getItem('rosee_last_notif_seen') || '0', 10);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedOrders = [...orders]
    .filter(o => !o.archived)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const unreadCount = sortedOrders.filter(
    o => new Date(o.date).getTime() > lastSeenTime
  ).length;

  const handleMarkAllRead = () => {
    const now = Date.now();
    localStorage.setItem('rosee_last_notif_seen', now.toString());
    setLastSeenTime(now);
  };

  return (
    <div className="relative font-arabic" ref={containerRef}>
      
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden text-right">
          
          <div className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900">إشعارات الطلبات</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {sortedOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-gray-400">لا توجد إشعارات حتى الآن.</p>
            ) : (
              sortedOrders.map((o) => {
                const isUnread = new Date(o.date).getTime() > lastSeenTime;
                return (
                  <div
                    key={o.id}
                    onClick={() => {
                      onSelectOrder(o.id);
                      setIsOpen(false);
                    }}
                    className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isUnread ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#111111] text-[#C5A059] flex items-center justify-center shrink-0 text-xs font-bold font-brand">
                      <Package className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 font-brand">#{o.id}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(o.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium truncate mt-0.5">
                        {o.name || 'عميل بدون اسم'} ({o.items.length} أصناف)
                      </p>
                      <p className="text-[10px] text-[#C5A059] font-bold mt-0.5">
                        {o.source === 'أونلاين' ? '🌐 طلب مباشر من المتجر' : '👨‍💻 مسجل يدوياً'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
};
