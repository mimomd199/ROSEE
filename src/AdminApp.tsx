import React, { useState, useEffect } from 'react';
import { subscribeToRoseeData, saveRoseeData, DEFAULT_DATABASE } from './lib/firebase';
import { RoseeDatabase } from './types';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminApp() {
  const [data, setData] = useState<RoseeDatabase>(DEFAULT_DATABASE);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time synchronization with Firebase Database
  useEffect(() => {
    const unsubscribe = subscribeToRoseeData((updatedData) => {
      setData(updatedData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveData = async (updatedData: RoseeDatabase) => {
    setData(updatedData);
    await saveRoseeData(updatedData);
  };

  const handleSwitchToStore = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 font-arabic space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-8 h-8 text-[#C5A059]" />
          </div>
          <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin absolute -top-1 -right-1" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-gray-200 tracking-wider">
            جاري تهيئة البوابة الإدارية المشفرة...
          </h2>
          <p className="text-xs text-gray-500 font-mono">
            R O S É E • E R P • S E C U R E • G A T E
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-arabic">
      <AdminDashboard
        data={data}
        onSaveData={handleSaveData}
        onSwitchToStore={handleSwitchToStore}
      />
    </div>
  );
}
