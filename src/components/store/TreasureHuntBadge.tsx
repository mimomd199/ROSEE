import React, { useState } from 'react';
import { Sparkles, Trophy, X, Copy, Check, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TreasureHuntConfig } from '../../types';

interface TreasureHuntBadgeProps {
  config: TreasureHuntConfig;
  collectedCount: number;
  isCompleted: boolean;
  onClaimPromo: (promoCode: string) => void;
  onResetHunt: () => void;
}

export const TreasureHuntBadge: React.FC<TreasureHuntBadgeProps> = ({
  config,
  collectedCount,
  isCompleted,
  onClaimPromo,
  onResetHunt
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!config.enabled) return null;

  const targetCount = config.targetCount || 3;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    if (isCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#C5A059', '#111111']
        });
      } catch (_) {}
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(config.rewardPromoCode);
    setCopiedCode(true);
    onClaimPromo(config.rewardPromoCode);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <>
      {/* Floating Rose Hunt Status Badge */}
      <div className="fixed bottom-24 left-4 z-40 animate-bounce duration-1000">
        <button
          type="button"
          onClick={handleOpenModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-xl transition-all cursor-pointer select-none active:scale-95 ${
            isCompleted
              ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black border-amber-300 font-bold animate-pulse'
              : 'bg-[#111111] text-white border-[#C5A059]/50 hover:border-[#C5A059]'
          }`}
          title="لعبة صيد الورود الذهبية"
        >
          <span className="text-base">🌹</span>
          <div className="text-right">
            <span className="text-[10px] block opacity-80 leading-none">صيد الوردة الذهبية</span>
            <span className="text-xs font-bold font-mono tracking-wider text-[#C5A059]">
              {collectedCount} / {targetCount}
            </span>
          </div>
          {isCompleted && (
            <Trophy className="w-4 h-4 text-black animate-spin duration-3000" />
          )}
        </button>
      </div>

      {/* Celebratory / Status Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-arabic animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#C5A059]/40 overflow-hidden text-center p-6 space-y-4">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isCompleted ? (
              <div className="space-y-4 pt-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center text-3xl shadow-md">
                  🏆
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-brand">
                    {config.rewardTitle || 'مبروك! عثرتِ على جميع الورود الذهبية 🌹✨'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    {config.rewardMessage || 'تهانينا لذكائك ودقة ملاحظتكِ! لقد حصلتِ على كود خصم حصري لتسوقك اليوم.'}
                  </p>
                </div>

                {/* Promo Code Box */}
                <div className="p-4 bg-[#FAF9F6] border border-[#C5A059] rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold block">كود الهدية الملكية:</span>
                    <span className="text-base font-mono font-bold text-[#8C6D2D] tracking-wider">
                      {config.rewardPromoCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  استخدم الكود في السلة الآن
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="text-4xl">🌹🔍</div>
                <h3 className="text-base font-bold text-gray-900">
                  صيد الورود الذهبية الفاخرة
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  توجد ورود ذهبية متلألئة مخفية بين كروت بعض المنتجات في المتجر! ابحثي عنها وانقري عليها لجمعها.
                </p>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center gap-3">
                  <span className="text-xs text-gray-600 font-semibold">مستوى تقدمك الحالي:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: targetCount }).map((_, idx) => (
                      <span 
                        key={idx}
                        className={`text-xl transition-transform ${idx < collectedCount ? 'scale-110 drop-shadow-md' : 'grayscale opacity-30'}`}
                      >
                        🌹
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-[#8C6D2D] font-bold">
                  اجمعي {targetCount - collectedCount} ورود إضافية لفتح كود خصم خاص!
                </p>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  متابعة البحث والاستكشاف
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
