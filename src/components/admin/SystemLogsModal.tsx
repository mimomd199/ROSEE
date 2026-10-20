import React from 'react';
import { Clock, X, User } from 'lucide-react';
import { SystemLog } from '../../types';

interface SystemLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SystemLog[];
}

export const SystemLogsModal: React.FC<SystemLogsModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-arabic">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col max-h-[80vh]">
        
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C5A059]" />
            <h3 className="text-base font-bold text-gray-900">سجل حركات النظام وتدقيق العمليات</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1">
          {logs.length === 0 ? (
            <p className="py-12 text-center text-xs text-gray-400">لا توجد حركات مسجلة حتى الآن.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5 text-right">
                  <p className="font-semibold text-gray-900">{log.action}</p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 shrink-0 font-medium">
                  <User className="w-3 h-3 text-[#C5A059]" />
                  <span>{log.user}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
