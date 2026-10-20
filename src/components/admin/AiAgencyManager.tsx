import React, { useState } from 'react';
import { 
  Sparkles, 
  Key, 
  Send, 
  RefreshCw, 
  TrendingUp, 
  Video, 
  MessageSquare, 
  Calendar, 
  Check, 
  Copy,
  AlertCircle
} from 'lucide-react';
import { Order, ProductCatalog } from '../../types';
import { generateAiMarketingContent } from '../../lib/gemini';

interface AiAgencyManagerProps {
  orders: Order[];
  catalog: ProductCatalog;
  onLogAction: (action: string) => void;
}

export const AiAgencyManager: React.FC<AiAgencyManagerProps> = ({
  orders,
  catalog,
  onLogAction
}) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('rosee_gemini_key') || '');
  const [activeTab, setActiveTab] = useState<'analysis' | 'social' | 'whatsapp' | 'planner'>('analysis');

  // AI Output states
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Social Studio Form
  const [socialPlatform, setSocialPlatform] = useState('TikTok Video (فيديو تيك توك قصير يعتمد على التريند والفوحان)');
  const [socialProduct, setSocialProduct] = useState(Object.keys(catalog)[0] || '');
  const [socialTone, setSocialTone] = useState('فاخرة وراقية (Luxury)');

  // WhatsApp Campaign Form
  const [waCampaignGoal, setWaCampaignGoal] = useState('استرجاع العملاء المنقطعين منذ فترة طويلة (Win-Back)');
  const [waProduct, setWaProduct] = useState('');
  const [waDiscount, setWaDiscount] = useState('شحن مجاني + عينة هدية');

  // Marketing Planner Form
  const [plannerGoal, setPlannerGoal] = useState('زيادة المبيعات المباشرة ورفع معدل الطلبات اليومية');

  const handleSaveKey = () => {
    localStorage.setItem('rosee_gemini_key', apiKey.trim());
    alert('✅ تم حفظ مفتاح الذكاء الاصطناعي بنجاح!');
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Generate Market Analysis
  const handleGenerateMarketAnalysis = async () => {
    setIsLoading(true);
    setOutput('');

    // Compute sales stats
    const stats: Record<string, number> = {};
    Object.keys(catalog).forEach(p => stats[p] = 0);

    orders.filter(o => o.status === 'delivered' && !o.archived).forEach(o => {
      o.items.forEach(i => {
        if (stats[i.name] !== undefined) stats[i.name] += i.qty;
      });
    });

    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const bestSeller = sorted[0]?.[0] || 'Bunny Rose';
    const slowSeller = sorted[sorted.length - 1]?.[0] || 'المنتجات الأخرى';

    const prompt = `أنت الخبير التسويقي و(CMO) لعلامة تجارية متخصصة في العطور ومستحضرات التجميل الراقية تسمى "Rosée".
المنتج الأكثر مبيعاً لدينا حالياً بناءً على طلبات المتجر هو: ${bestSeller} (مبيعات: ${sorted[0]?.[1] || 0} قطعة).
المنتج الأقل مبيعاً (الراكد) هو: ${slowSeller} (مبيعات: ${sorted[sorted.length - 1]?.[1] || 0} قطعة).

بناءً على هذه البيانات الحقيقية من متجرنا:
1. اكتب لي تحليلاً تسويقياً موجزاً يوضح سبب تفوق المنتج الأول.
2. 3 نصائح مبتكرة وقابلة للتطبيق الفوري (Actionable) لزيادة مبيعات المنتج الراكد، وكيفية ربطه في باقة عروض مع المنتج الأكثر طلباً.
3. فكرة حملة تسويقية مقترحة للأسبوع القادم.
اكتب باللغة العربية بأسلوب راقٍ ومباشر وعملي بنقاط واضحة.`;

    try {
      const res = await generateAiMarketingContent({ prompt, customApiKey: apiKey });
      setOutput(res);
      onLogAction('توليد تحليل ذكي للسوق بالذكاء الاصطناعي');
    } catch (e: any) {
      setOutput(`حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Generate Social Media Concept
  const handleGenerateSocial = async () => {
    setIsLoading(true);
    setOutput('');

    const prompt = `أنت صانع محتوى محترف (Creative Director) على السوشيال ميديا لبراند عطور ومستحضرات تجميل فخم اسمه "Rosée".
المطلوب منك ابتكار فكرة إعلان متكاملة للمنتج التالي: ${socialProduct}
نوع الإعلان والمنصة: ${socialPlatform}
نبرة الصوت المطلوبة (Tone of Voice): ${socialTone}

قم بتوليد الآتي بالتفصيل:
1. فكرة التصوير (Visual Concept): اشرح كيف نصور هذا الإعلان بكاميرا الموبايل ليكون جذاباً وسينمائياً.
2. الخطاف (The Hook): الجملة القوية التي ستقال أو تكتب في أول 3 ثوانٍ لجذب الانتباه ومنع التمرير.
3. النص المكتوب (Caption): بوست جذاب يشجع على التفاعل وينتهي بـ Call to Action للطلب من الموقع فوراً.
4. الهاشتاجات: 5-7 هاشتاجات فعالة لنشاط العطور والتجميل في مصر والخليج.`;

    try {
      const res = await generateAiMarketingContent({ prompt, customApiKey: apiKey });
      setOutput(res);
      onLogAction('توليد فكرة إعلان سوشيال ميديا بالذكاء الاصطناعي');
    } catch (e: any) {
      setOutput(`حدث خطأ: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Generate WhatsApp Campaign
  const handleGenerateWhatsApp = async () => {
    setIsLoading(true);
    setOutput('');

    const prompt = `أنت كاتب نصوص إعلانية محترف (Direct Response Copywriter) لمتجر "Rosée" لمنتجات العناية والعطور الفاخرة.
اكتب رسالة واتساب مميزة (WhatsApp Broadcast Message) لإرسالها للعميلات.
هدف الرسالة: ${waCampaignGoal}.
المنتج المقترح (إن وجد): ${waProduct || 'تشكيلة العطور الملكية'}.
العرض أو الميزة الحصرية المتاحة: ${waDiscount}.

شروط الرسالة:
- ابدأ بترحيب شخصي دافئ بصيغة المؤنث الراقية.
- استخدم إيموجيز مناسبة وفخمة (✨, 🌸, 🎁).
- اكتب بأسلوب محادثة طبيعي وجذاب يوضح القيمة الفورية.
- اختم بطلب إجراء واضح (Call to Action) لترد العميل برقم الطلب أو تزور الرابط.`;

    try {
      const res = await generateAiMarketingContent({ prompt, customApiKey: apiKey });
      setOutput(res);
      onLogAction('توليد نص حملة واتساب بالذكاء الاصطناعي');
    } catch (e: any) {
      setOutput(`حدث خطأ: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Generate Monthly Marketing Strategy
  const handleGeneratePlanner = async () => {
    setIsLoading(true);
    setOutput('');

    const prompt = `أنت مدير تسويق استراتيجي متمرس (Head of Growth). ضع لي خطة تسويقية شهرية لعلامتي التجارية "Rosée" (عطور ومستحضرات عناية فاخرة).
الهدف الرئيسي لهذا الشهر: ${plannerGoal}.

قسم الخطة إلى 4 أسابيع متتالية. في كل أسبوع حدد:
- عنوان الأسبوع والمفهوم الترويجي.
- العرض أو الخصم المطروح (Offer).
- أفكار المحتوى على تيك توك وإنستجرام (Content Pillars).
- خطوة تفاعلية مع قاعدة العملاء الحالية في الـ CRM عبر الواتساب.

الخطة يجب أن تكون إبداعية، قابلة للتطبيق الفوري، ومصممة لمضاعفة المبيعات. اكتب بنقاط واضحة.`;

    try {
      const res = await generateAiMarketingContent({ prompt, customApiKey: apiKey });
      setOutput(res);
      onLogAction('توليد خطة تسويقية شهرية بالذكاء الاصطناعي');
    } catch (e: any) {
      setOutput(`حدث خطأ: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Header and API Key Box */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            وكالة التسويق الافتراضية (Gemini AI Marketing Studio)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ابتكار حملات وأفكار حصرية ومباشرة بالاعتماد على ذكاء نماذج Gemini Flash المتقدمة وتحليل بيانات متجرك الحقيقية.
          </p>
        </div>

        {/* API Key Input */}
        <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 shrink-0">
            <Key className="w-4 h-4 text-purple-600" />
            <span>مفتاح Gemini API (اختياري):</span>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="flex-1 p-2 text-xs border border-purple-300 rounded-lg bg-white font-mono focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSaveKey}
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            حفظ المفتاح
          </button>
        </div>
      </div>

      {/* Agency Capabilities Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'analysis', label: '📊 التحليل الذكي للسوق' },
          { id: 'social', label: '🎬 استوديو السوشيال ميديا' },
          { id: 'whatsapp', label: '💬 كاتب حملات الواتساب' },
          { id: 'planner', label: '📅 مخطط التسويق الشهري' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setOutput('');
            }}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* 1. Market Analysis */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">تحليل الأداء الفعلي للمتجر 🔎</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                يقوم النظام بإرسال ملخص أرقام المنتجات الأكثر مبيعاً والأقل إقبالاً لـ Gemini ليقترح عليك خطوات ملموسة لرفع المبيعات وتصفية الراكد.
              </p>
            </div>

            <button
              onClick={handleGenerateMarketAnalysis}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'جاري التحليل واستدعاء الذكاء الاصطناعي...' : 'بدء تحليل السوق الحصري من Gemini'}</span>
            </button>
          </div>
        )}

        {/* 2. Social Media Studio */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">توليد محتوى احترافي للسوشيال ميديا 🎬</h3>
              <p className="text-xs text-gray-500 mt-0.5">ابتكار فكرة تصوير، خطاف أول 3 ثوانٍ، كابشن جذاب وهاشتاجات.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">المنصة ونوع المحتوى:</label>
                <select
                  value={socialPlatform}
                  onChange={(e) => setSocialPlatform(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white font-medium"
                >
                  <option value="TikTok Video (فيديو تيك توك تريند سريع)">TikTok Video</option>
                  <option value="Instagram Reel (ريلز انستجرام سينمائي فخم)">Instagram Reel</option>
                  <option value="Facebook Post (بوست تفاعلي مع كول تو آكشن مباشر)">Facebook Post</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">المنتج المراد الترويج له:</label>
                <select
                  value={socialProduct}
                  onChange={(e) => setSocialProduct(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white font-medium"
                >
                  {Object.keys(catalog).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">نبرة الخطاب (Tone):</label>
                <select
                  value={socialTone}
                  onChange={(e) => setSocialTone(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white font-medium"
                >
                  <option value="فاخرة وراقية (Luxury)">فاخرة وراقية (Luxury)</option>
                  <option value="حماسية وسريعة تخلق استعجال (Urgency)">عاجل وحماسي (Urgency)</option>
                  <option value="تعليمية عن ثبات ومكونات العطور (Educational)">تعليمي ومقنع (Educational)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateSocial}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>{isLoading ? 'جاري كتابة الفكرة...' : 'توليد إعلان مبتكر بواسطة Gemini'}</span>
            </button>
          </div>
        )}

        {/* 3. WhatsApp Campaign Writer */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">كاتب حملات رسائل الواتساب 💬</h3>
              <p className="text-xs text-gray-500 mt-0.5">صياغة رسائل موجهة لزيادة معدل الرد والطلب الفوري.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">هدف الحملة:</label>
                <select
                  value={waCampaignGoal}
                  onChange={(e) => setWaCampaignGoal(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white"
                >
                  <option value="استرجاع العملاء المنقطعين منذ فترة طويلة (Win-Back)">استرجاع العملاء (Win-Back)</option>
                  <option value="تذكير بنقاط الولاء واستبدالها بخصم نقدي">تذكير بنقاط الولاء (Loyalty)</option>
                  <option value="عرض سري ومخصص لعملاء الـ VIP فقط">عرض لعملاء الـ VIP</option>
                  <option value="تجديد الشراء بعد اقتراب انتهاء العبوة السابقة">تجديد الشراء (Replenishment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">المنتج (اختياري):</label>
                <select
                  value={waProduct}
                  onChange={(e) => setWaProduct(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white"
                >
                  <option value="">-- كل المنتجات / عام --</option>
                  {Object.keys(catalog).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">الخصم أو الحافز:</label>
                <input
                  type="text"
                  value={waDiscount}
                  onChange={(e) => setWaDiscount(e.target.value)}
                  placeholder="مثال: خصم 20% أو توصيل مجاني"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateWhatsApp}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <MessageSquare className="w-4 h-4 text-[#C5A059]" />
              <span>{isLoading ? 'جاري كتابة الرسالة...' : 'كتابة رسالة واتساب بواسطة Gemini'}</span>
            </button>
          </div>
        )}

        {/* 4. Marketing Growth Planner */}
        {activeTab === 'planner' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">مخطط التسويق الشهري الاستراتيجي 📅</h3>
              <p className="text-xs text-gray-500 mt-0.5">تقسيم خطة العمل لأربعة أسابيع مع خطة المحتوى والعروض والـ CRM.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">الهدف الرئيسي للشهر الحالي:</label>
              <select
                value={plannerGoal}
                onChange={(e) => setPlannerGoal(e.target.value)}
                className="w-full sm:w-1/2 p-2.5 text-xs border border-gray-200 rounded-xl bg-white"
              >
                <option value="زيادة المبيعات المباشرة ورفع معدل الطلبات اليومية">زيادة المبيعات المباشرة ورفع معدل الطلبات</option>
                <option value="تصفية المخزون الراكد وتصريف العبوات القديمة">تصفية المخزون الراكد بباقات ذكية</option>
                <option value="زيادة الوعي بالعلامة وبناء مجتمع عملاء مخلصين">زيادة الوعي وبناء الثقة</option>
              </select>
            </div>

            <button
              onClick={handleGeneratePlanner}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Calendar className="w-4 h-4 text-[#C5A059]" />
              <span>{isLoading ? 'جاري بناء الخطة...' : 'توليد الخطة الشهرية بواسطة Gemini'}</span>
            </button>
          </div>
        )}

        {/* AI Output Result Box */}
        {output && (
          <div className="mt-6 p-6 bg-[#FAF9F6] border border-[#C5A059]/30 rounded-2xl relative space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-xs font-bold text-[#8C6D2D] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                مخرجات الذكاء الاصطناعي (Gemini 2.5 Flash):
              </span>
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-arabic">
              {output}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
