import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, ArrowLeft, Check, RefreshCw, ShoppingBag, Star, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from '@google/genai';
import { QuizConfig, ProductCatalog, ProductSize } from '../../types';

interface ProductQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: QuizConfig;
  catalog: ProductCatalog;
  onAddToCart: (productKey: string, size?: ProductSize, qty?: number) => void;
  onOpenCart: () => void;
}

export const ProductQuizModal: React.FC<ProductQuizModalProps> = ({
  isOpen,
  onClose,
  config,
  catalog,
  onAddToCart,
  onOpenCart
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: { optionId: string; label: string; matchedProduct?: string } }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [recommendedProductKey, setRecommendedProductKey] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number>(98);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);

  if (!isOpen) return null;

  const questions = config.questions && config.questions.length > 0 ? config.questions : [];
  const totalSteps = questions.length;
  const isFinished = currentStep >= totalSteps;
  const currentQ = questions[currentStep];

  const handleSelectOption = (optionId: string, label: string, matchedProduct?: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: { optionId, label, matchedProduct }
    }));
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Analyze results
      setIsAnalyzing(true);
      setCurrentStep(totalSteps); // move to result step

      // 1. First find fallback match from chosen options
      const chosenMatches = Object.values(selectedAnswers)
        .map(a => a.matchedProduct)
        .filter(Boolean) as string[];

      // Count occurrences or pick the latest
      let bestFallbackKey = chosenMatches[chosenMatches.length - 1];
      if (!bestFallbackKey || !catalog[bestFallbackKey]) {
        bestFallbackKey = Object.keys(catalog)[0];
      }

      // 2. If useAI is enabled, call Gemini API
      if (config.useAI) {
        try {
          const ai = new GoogleGenAI();
          const catalogSummary = Object.entries(catalog).map(([k, item]) => 
            `- ${k}: ${item.description || ''} (السعر: ${item.defaultPrice} ج.م)`
          ).join('\n');

          const userChoicesSummary = Object.entries(selectedAnswers).map(([qId, ans], idx) => 
            `سؤال ${idx + 1}: ${ans.label}`
          ).join(' | ');

          const prompt = `أنت خبير واستشاري عطور وعناية بالبشرة لعلامة ROSÉE الفاخرة.
قام العميل بالإجابة على الاختبار بالخيارات التالية:
${userChoicesSummary}

كتالوج المنتجات المتوفرة:
${catalogSummary}

المطلوب:
1. اختر المنتج الأنسب تماماً لهذا العميل من قائمة الكتالوج أعلاه باسمه الدقيق كما هو في الكتالوج.
2. اكتب جملة إطراء وتوصية فاخرة باللغة العربية (سطرين أو ثلاثة فقط) توضح سر تطابق هذا العطر أو المنتج مع شخصية العميل ورغباته.
صيغة الرد المطلوبة بدقة:
PRODUCT_KEY: [اسم المنتج كما هو تماماً في الكتالوج]
ADVICE: [نص التوصية الفاخر المخصص]`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              temperature: 0.7
            }
          });

          const replyText = response.text || '';
          const keyMatch = replyText.match(/PRODUCT_KEY:\s*(.*)/i);
          const adviceMatch = replyText.match(/ADVICE:\s*([\s\S]*)/i);

          let chosenKey = keyMatch ? keyMatch[1].trim() : bestFallbackKey;
          // Validate key exists in catalog
          if (!catalog[chosenKey]) {
            const foundSimilar = Object.keys(catalog).find(k => k.includes(chosenKey) || chosenKey.includes(k));
            chosenKey = foundSimilar || bestFallbackKey;
          }

          setRecommendedProductKey(chosenKey);
          setAnalysisText(adviceMatch ? adviceMatch[1].trim() : 'اختيار ملكي متفرد ينسجم تماماً مع اختياراتك ويمنحك حضوراً آسراً لا يُقاوم.');
          setMatchScore(Math.floor(94 + Math.random() * 5));
        } catch (err) {
          console.warn("AI Matcher fallback used:", err);
          setRecommendedProductKey(bestFallbackKey);
          setAnalysisText('بناءً على تفضيلاتك الراقية في النفحات والمناسبة، هذا هو الاختيار الأمثل الذي صُمم خصيصاً ليبرز شخصيتك الفريدة.');
          setMatchScore(97);
        }
      } else {
        // Manual match
        setTimeout(() => {
          setRecommendedProductKey(bestFallbackKey);
          setAnalysisText('بناءً على تفضيلاتك المختارة، هذا العطر هو الأكثر تناغماً مع ذوقك ومناسبتك.');
          setMatchScore(98);
        }, 600);
      }

      setIsAnalyzing(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#111111', '#E8D5A3']
        });
      } catch (_) {}
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedAnswers({});
    setRecommendedProductKey(null);
    setAnalysisText(null);
    setAddedToCartSuccess(false);
  };

  const recommendedItem = recommendedProductKey ? catalog[recommendedProductKey] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-arabic animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#C5A059]/30 overflow-hidden my-6">
        
        {/* Header Banner */}
        <div className="bg-[#111111] p-6 text-white text-center relative border-b border-[#C5A059]/30">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A059]/20 border border-[#C5A059]/40 rounded-full text-[#C5A059] text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{config.useAI ? 'اكتشاف ذكي بالذكاء الاصطناعي (AI Matcher)' : 'اختبار اكتشاف العطر والمنتج المناسب'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-brand tracking-wide text-white">
            {config.title || 'مستشارك العطري الذكي ✨'}
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-md mx-auto leading-relaxed">
            {config.subtitle || 'أجيبي عن الأسئلة البسيطة لنرشح لكِ أنسب اختيار ملكي من تشكيلة ROSÉE.'}
          </p>

          {/* Progress bar */}
          {!isFinished && questions.length > 0 && (
            <div className="mt-4 flex items-center gap-2 max-w-xs mx-auto">
              <span className="text-[10px] text-gray-400 font-mono font-bold">
                {currentStep + 1} / {totalSteps}
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C5A059] transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isFinished && currentQ ? (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <span className="text-xs font-bold text-[#8C6D2D] mb-1 block">السؤال {currentStep + 1}</span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map(opt => {
                  const isSelected = selectedAnswers[currentQ.id]?.optionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id, opt.label, opt.matchedProduct)}
                      className={`w-full p-4 text-right rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs sm:text-sm ${
                        isSelected 
                          ? 'border-[#C5A059] bg-[#FAF9F6] text-[#111111] font-bold shadow-sm ring-1 ring-[#C5A059]' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedAnswers[currentQ.id]}
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{currentStep === totalSteps - 1 ? 'اكتشف ترشيحك الآن ✨' : 'التالي'}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900">جاري تحليل تفضيلاتك عبر الذكاء الاصطناعي...</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                نطابق إجاباتك مع النوتات العطرية والمكونات الطبيعية في تشكيلة ROSÉE لاختيار الأنسب لكِ بدقة.
              </p>
            </div>
          ) : recommendedItem && recommendedProductKey ? (
            /* Result recommendation card */
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold mb-2">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>نسبة التطابق مع ذوقك: {matchScore}%</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">ترشيحنا الملكي المخصص لكِ:</h3>
              </div>

              {/* Product Match Card */}
              <div className="p-4 sm:p-5 bg-[#FAF9F6] border border-[#C5A059]/40 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                <img 
                  src={recommendedItem.image || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80'} 
                  alt={recommendedProductKey}
                  className="w-28 h-28 object-cover rounded-xl shadow-xs border border-gray-100 shrink-0"
                />

                <div className="flex-1 text-right">
                  <span className="text-[10px] font-bold text-[#8C6D2D] uppercase tracking-wider block mb-1">
                    {recommendedItem.collectionName || 'تشكيلة ROSÉE الفاخرة'}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 font-brand">
                    {recommendedProductKey.replace(/^(.*?):\s*(.*?)\s*\((.*?)\)$/, '$2')}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {recommendedItem.description || 'مستحضر تجميل وعناية راقي ومثالي للاستخدام اليومي.'}
                  </p>
                  <div className="mt-2 text-sm font-bold text-[#C5A059] tabular-nums font-brand">
                    {recommendedItem.defaultPrice} ج.م
                  </div>
                </div>
              </div>

              {/* AI Advice note */}
              {analysisText && (
                <div className="p-4 bg-white border border-gray-100 rounded-2xl text-xs text-gray-700 leading-relaxed shadow-xs flex items-start gap-2.5">
                  <Bot className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block mb-0.5">تحليل المستشار العطري:</span>
                    <span>{analysisText}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const firstSize = recommendedItem.hasSizes && recommendedItem.sizes ? recommendedItem.sizes[0] : undefined;
                    onAddToCart(recommendedProductKey, firstSize, 1);
                    setAddedToCartSuccess(true);
                    setTimeout(() => setAddedToCartSuccess(false), 3000);
                  }}
                  className="flex-1 py-3 px-4 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedToCartSuccess ? 'تمت الإضافة للسلة بنجاح ✓' : 'إضافة هذا المنتج للسلة مباشرة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  className="py-3 px-4 bg-[#FAF9F6] hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  عرض السلة
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="إعادة الاختبار"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500">لا توجد أسئلة محددة حالياً.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
