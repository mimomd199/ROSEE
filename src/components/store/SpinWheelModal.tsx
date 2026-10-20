import React, { useState, useRef } from 'react';
import { X, Sparkles, Gift, Copy, Check, ArrowLeft, Phone, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SpinWheelConfig, SpinPrize } from '../../types';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SpinWheelConfig;
  onClaimPromo: (promoCode: string) => void;
}

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  config,
  onClaimPromo
}) => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [wonPrize, setWonPrize] = useState<SpinPrize | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSpinning) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSpinning, onClose]);

  if (!isOpen) return null;

  const prizes = config.prizes && config.prizes.length > 0 ? config.prizes : [];
  const sliceCount = prizes.length;
  const sliceAngle = 360 / (sliceCount || 1);

  const handleStartSpin = () => {
    const cleanContact = phoneOrEmail.trim();
    if (!cleanContact || cleanContact.length < 5) {
      setFormError('يرجى إدخال رقم الموبايل أو البريد الإلكتروني للمشاركة.');
      return;
    }
    setFormError(null);
    setHasStarted(true);
    setIsSpinning(true);

    // Weighted selection of winning prize based on probability
    const totalWeight = prizes.reduce((sum, p) => sum + (Number(p.probability) || 10), 0);
    let randomNum = Math.random() * totalWeight;
    let selectedPrizeIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      randomNum -= (Number(prizes[i].probability) || 10);
      if (randomNum <= 0) {
        selectedPrizeIndex = i;
        break;
      }
    }

    const targetPrize = prizes[selectedPrizeIndex];

    // Compute rotation angle
    // Arrow is at the top (270 deg or 90 deg depending on orientation).
    // Each slice occupies sliceAngle degrees.
    // The center of slice i is at i * sliceAngle + sliceAngle / 2.
    // To land slice i at the top pointer (0 deg):
    const sliceCenterAngle = selectedPrizeIndex * sliceAngle + sliceAngle / 2;
    const spins = 5 * 360; // 5 full revolutions
    // Invert because wheel rotates clockwise
    const finalAngle = rotationDegree + spins + (360 - sliceCenterAngle);

    setRotationDegree(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(targetPrize);
      onClaimPromo(targetPrize.promoCode);

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#C5A059', '#111111', '#E8D5A3', '#FFFFFF']
        });
      } catch (_) {}
    }, 4500);
  };

  const handleCopyCode = () => {
    if (!wonPrize) return;
    navigator.clipboard.writeText(wonPrize.promoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Wheel size dimension classes based on config.wheelSize
  const wheelSizeClass = 
    config.wheelSize === 'compact' ? 'w-52 h-52 sm:w-60 sm:h-60' :
    config.wheelSize === 'large' ? 'w-72 h-72 sm:w-84 sm:h-84' :
    config.wheelSize === 'xlarge' ? 'w-80 h-80 sm:w-96 sm:h-96' :
    'w-64 h-64 sm:w-72 sm:h-72';

  const modalMaxWClass = 
    config.wheelSize === 'compact' ? 'max-w-md' :
    config.wheelSize === 'large' ? 'max-w-xl' :
    config.wheelSize === 'xlarge' ? 'max-w-2xl' :
    'max-w-lg';

  return (
    <div 
      onClick={(e) => {
        // Exit without using wheel if clicked on backdrop
        if (e.target === e.currentTarget && !isSpinning) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-arabic animate-fade-in overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`relative w-full ${modalMaxWClass} bg-white rounded-3xl shadow-2xl border border-[#C5A059]/40 overflow-hidden my-6 cursor-default transition-all duration-300`}
      >
        
        {/* Header Banner */}
        <div className="bg-[#111111] p-5 text-white text-center relative border-b border-[#C5A059]/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isSpinning}
            className="absolute left-4 top-4 px-3 py-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="إغلاق ومتابعة التسوق"
          >
            <span>إغلاق</span>
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A059]/20 border border-[#C5A059]/40 rounded-full text-[#C5A059] text-[11px] font-bold mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>عرض حصري للعملاء المميزين</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-brand tracking-wide text-white">
            {config.title || 'عجلة هدايا ROSÉE الفاخرة 🎡✨'}
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto leading-relaxed">
            {config.subtitle || 'أدخلي بياناتكِ وجربي حظكِ الآن للفوز بهدايا وخصومات فورية على طلبك!'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Wheel Graphic with dynamic size */}
          <div className={`relative ${wheelSizeClass} my-2 select-none`}>
            {/* Top Pointer */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-[#C5A059] drop-shadow-md" />

            {/* Center Pin */}
            <div className="absolute inset-0 m-auto z-10 w-12 h-12 rounded-full bg-[#111111] border-2 border-[#C5A059] shadow-lg flex items-center justify-center text-[#C5A059] font-bold text-xs">
              <Sparkles className="w-5 h-5" />
            </div>

            {/* Rotating SVG Wheel */}
            <div 
              className="w-full h-full rounded-full shadow-2xl border-4 border-[#C5A059]/80 overflow-hidden"
              style={{
                transform: `rotate(${rotationDegree}deg)`,
                transition: isSpinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {prizes.map((prize, idx) => {
                  const startAngle = idx * sliceAngle;
                  const endAngle = (idx + 1) * sliceAngle;
                  const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  const textAngle = startAngle + sliceAngle / 2;
                  const textRad = (Math.PI * (textAngle - 90)) / 180;
                  const tx = 50 + 32 * Math.cos(textRad);
                  const ty = 50 + 32 * Math.sin(textRad);

                  return (
                    <g key={prize.id || idx}>
                      <path 
                        d={pathData} 
                        fill={prize.color || (idx % 2 === 0 ? '#C5A059' : '#111111')} 
                        stroke="#FAF9F6" 
                        strokeWidth="0.5" 
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill={prize.textColor || (idx % 2 === 0 ? '#111111' : '#FFFFFF')}
                        fontSize="3.8"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                        className="font-arabic pointer-events-none"
                      >
                        {prize.label.length > 14 ? prize.label.substring(0, 13) + '..' : prize.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Form or Result View */}
          {!wonPrize ? (
            <div className="w-full max-w-sm mt-4 space-y-3">
              {!hasStarted && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 text-right">
                    أدخلي رقم الواتساب أو البريد الإلكتروني للمشاركة:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="010xxxxxxxx أو email@example.com"
                      className="w-full px-3.5 py-2.5 text-xs text-center border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] font-semibold"
                    />
                  </div>
                  {formError && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 text-right">
                      {formError}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={isSpinning}
                onClick={handleStartSpin}
                className="w-full py-3.5 px-4 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>{isSpinning ? 'جاري تدوير العجلة... ترقبي هديتك!' : (config.buttonLabel || 'أدر العجلة الآن للفوز 🎁')}</span>
              </button>

              <button
                type="button"
                disabled={isSpinning}
                onClick={onClose}
                className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-bold cursor-pointer border border-dashed border-gray-200 hover:border-gray-400 rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>✕ تخطي ومتابعة التسوق دون استخدام العجلة</span>
              </button>
            </div>
          ) : (
            /* Won Prize Result */
            <div className="w-full max-w-sm mt-4 p-5 bg-[#FAF9F6] border border-[#C5A059] rounded-2xl text-center space-y-3 animate-fade-in shadow-sm">
              <div className="text-2xl">🎉✨</div>
              <h3 className="text-base font-bold text-gray-900">
                تهانينا! لقد ربحتِ:
              </h3>
              <p className="text-sm font-bold text-[#8C6D2D]">
                {wonPrize.label}
              </p>

              {/* Promo Code Box */}
              <div className="p-3 bg-white border border-[#C5A059]/40 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <span className="text-xs text-gray-500 font-bold">كود الخصم:</span>
                <span className="text-sm font-mono font-bold text-gray-900 tracking-wider">
                  {wonPrize.promoCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-500">
                تم تفعيل الكود، يمكنك استخدامه مباشرة في سلة المشتريات عند إتمام الطلب!
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                متابعة التسوق واستخدام الخصم
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
