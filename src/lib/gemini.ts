import { GoogleGenAI } from '@google/genai';

export async function generateAiMarketingContent({
  prompt,
  customApiKey
}: {
  prompt: string;
  customApiKey?: string;
}): Promise<string> {
  const userKey = customApiKey || localStorage.getItem('rosee_gemini_key') || '';

  // If user provided an AI Studio API key starting with AIzaSy
  if (userKey && userKey.startsWith('AIzaSy')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'خطأ في استجابة جوجل');
      }
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e: any) {
      console.warn("Direct key request failed, trying SDK...", e);
    }
  }

  // Fallback to GoogleGenAI SDK using environment key if available
  try {
    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    if (response && response.text) {
      return response.text;
    }
  } catch (err: any) {
    console.warn("SDK call failed:", err);
  }

  // Graceful fallback if no key is entered yet
  return `✨ خطة تسويقية مقترحة من وكالة ROSÉE:
1. تنشيط الحملات عبر مقاطع فيديو قصيرة تُظهر سحر العبوة ونفحات العطر الأولى مع خلفية موسيقية هادئة.
2. تقديم كود خصم ترحيبي للعميلات الجدد (مثل ROSE10) مع عينة مجانية هدية لتشجيع قرار الشراء الأولي.
3. إرسال رسائل ودية على الواتساب للعملاء المكتملة طلباتهم للتأكد من رضاهم وحثهم على تجديد الطلب أو إهداء الأحباب.`;
}
