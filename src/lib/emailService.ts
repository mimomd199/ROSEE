/**
 * Security & Email Delivery Service for Rosée Store
 * Handles cryptographic token generation, numeric OTP generation,
 * SHA-256 password hashing, and multi-channel transactional email dispatch.
 */

export function generateNumericOTP(length: number = 6): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const num = array[0] % Math.pow(10, length);
    return num.toString().padStart(length, '0');
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateSecureToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
}

export async function hashPassword(plainText: string): Promise<string> {
  const clean = plainText.trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for older environments
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

export function buildResetEmailTemplate(userName: string, otp: string, resetLink: string, expiryMinutes: number = 15): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كود استعادة كلمة المرور (OTP) - متجر Rosée</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0d0d;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #E6E6E6;
      direction: rtl;
    }
    .wrapper {
      width: 100%;
      background-color: #0d0d0d;
      padding: 30px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #141414;
      border: 1px solid rgba(197, 160, 89, 0.4);
      border-radius: 24px;
      padding: 35px 30px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.8);
      text-align: right;
    }
    .brand-header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(197, 160, 89, 0.2);
    }
    .brand-name {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #C5A059;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      letter-spacing: 2px;
      color: #888888;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .content-body {
      padding: 25px 0;
      line-height: 1.8;
      font-size: 14px;
      color: #cccccc;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 15px;
    }
    .otp-card {
      background: linear-gradient(135deg, rgba(197, 160, 89, 0.12) 0%, rgba(20, 20, 20, 0.8) 100%);
      border: 2px dashed #C5A059;
      padding: 25px;
      border-radius: 18px;
      text-align: center;
      margin: 25px 0;
    }
    .otp-label {
      font-size: 12px;
      color: #C5A059;
      font-weight: 800;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .otp-number {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 14px;
      color: #FFFFFF;
      font-family: 'Courier New', Courier, monospace;
      text-shadow: 0 0 15px rgba(197, 160, 89, 0.5);
      direction: ltr;
      display: inline-block;
    }
    .otp-expiry {
      font-size: 11px;
      color: #999999;
      margin-top: 10px;
    }
    .cta-container {
      text-align: center;
      margin: 25px 0 15px 0;
    }
    .btn-reset {
      display: inline-block;
      background: linear-gradient(135deg, #DFBA73 0%, #C5A059 100%);
      color: #0D0D0D !important;
      text-decoration: none;
      padding: 13px 34px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(197, 160, 89, 0.35);
    }
    .warning-box {
      background: rgba(197, 160, 89, 0.08);
      border-right: 3px solid #C5A059;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 12px;
      color: #b5b5b5;
      margin-top: 25px;
    }
    .footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="brand-header">
        <h1 class="brand-name">R O S É E</h1>
        <div class="brand-sub">LUXURY BEAUTY & FRAGRANCE • SECURE GATEWAY</div>
      </div>

      <div class="content-body">
        <div class="greeting">مرحباً ${userName}،</div>
        <p>
          تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في بوابة إدارة متجر <strong>Rosée</strong>.
        </p>

        <!-- Big Bold OTP Box -->
        <div class="otp-card">
          <div class="otp-label">رمز التحقق لمرة واحدة (OTP)</div>
          <div class="otp-number">${otp}</div>
          <div class="otp-expiry">⏳ صالح لمدة <strong>${expiryMinutes} دقيقة</strong> فقط من وقت الاستلام</div>
        </div>

        <p>
          يمكنك إدخال هذا الكود مباشرة في شاشة التحقق، أو النقر على الرابط المباشر بالأسفل:
        </p>

        <div class="cta-container">
          <a href="${resetLink}" class="btn-reset" target="_blank">
            إعادة تعيين كلمة المرور عبر الرابط 🔒
          </a>
        </div>

        <div class="warning-box">
          ⚠️ <strong>تنبيه أمني:</strong>
          <br>
          • لا تشارك هذا الرمز مع أي شخص إطلاقاً؛ موظفو الدعم الفني لن يطلبوا منك كلمة المرور أو كود الـ OTP أبداً.
          <br>
          • إذا لم تكن أنت من طلب هذا الرمز، يرجى تجاهل هذه الرسالة فوراً.
        </div>
      </div>

      <div class="footer">
        جميع الحقوق محفوظة © ${new Date().getFullYear()} متجر Rosée Cosmetics.
        <br>
        تم إرسال هذا البريد تلقائياً من خادم الأمان المشفر.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface SendResetEmailParams {
  toEmail: string;
  userName: string;
  otp: string;
  resetLink: string;
  resendApiKey?: string;
  senderEmail?: string;
  smtp?: {
    host: string;
    port?: number;
    user: string;
    pass: string;
    secure?: boolean;
  };
}

export interface SendResetResult {
  success: boolean;
  message: string;
  provider?: 'resend' | 'smtp' | 'serverless';
  errorDetails?: any;
}

/**
 * Dispatches the reset email with OTP via Resend API or Vercel serverless function (with Nodemailer SMTP).
 */
export async function sendPasswordResetEmail({
  toEmail,
  userName,
  otp,
  resetLink,
  resendApiKey,
  senderEmail,
  smtp
}: SendResetEmailParams): Promise<SendResetResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  let apiKey = resendApiKey?.trim() || 
    (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) || 
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RESEND_API_KEY) || '';

  // Fallback: load directly from Firebase if not yet populated in client memory
  if (!apiKey && typeof window !== 'undefined') {
    try {
      const fbSnap = await fetch('https://rosee-erp-default-rtdb.firebaseio.com/rosee_data/settings/resendApiKey.json');
      if (fbSnap.ok) {
        const val = await fbSnap.json();
        if (typeof val === 'string' && val.trim()) {
          apiKey = val.trim();
        }
      }
    } catch (_) {}
  }

  const htmlContent = buildResetEmailTemplate(userName, otp, resetLink, 15);
  const subject = `كود التحقق (OTP): ${otp} - استعادة كلمة المرور لمتجر Rosée`;

  // Channel 1: Serverless function endpoint (/api/send-otp)
  try {
    const srvRes = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: cleanEmail,
        userName,
        otp,
        resetLink,
        subject,
        htmlContent,
        resendApiKey: apiKey,
        senderEmail,
        smtp
      })
    });

    const resJson = await srvRes.json().catch(() => ({}));

    if (srvRes.ok && resJson.success) {
      return {
        success: true,
        message: 'تم إرسال كود التحقق بنجاح إلى بريدك الإلكتروني.',
        provider: resJson.provider || 'resend'
      };
    } else {
      return {
        success: false,
        message: resJson.message || resJson.error || 'تعذر إرسال البريد الإلكتروني. يرجى التأكد من إعدادات خدمة البريد.',
        errorDetails: resJson
      };
    }
  } catch (err: any) {
    console.error('Serverless send-otp failed:', err);
    return {
      success: false,
      message: 'تعذر الاتصال بخادم إرسال البريد الإلكتروني.',
      errorDetails: err?.message
    };
  }
}
