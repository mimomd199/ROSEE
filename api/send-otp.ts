import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    toEmail,
    userName,
    otp,
    resetLink,
    subject,
    htmlContent,
    resendApiKey,
    senderEmail,
    smtp
  } = req.body || {};

  if (!toEmail || !otp) {
    return res.status(400).json({ error: 'Missing required email or OTP' });
  }

  const cleanEmail = String(toEmail).trim().toLowerCase();

  // 1. Try Resend API (via parameter, or Vercel environment variables)
  const effectiveResendKey = (resendApiKey && String(resendApiKey).trim()) ||
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY;

  if (effectiveResendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveResendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: senderEmail?.trim() || process.env.RESEND_FROM_EMAIL || 'Rosée Security <onboarding@resend.dev>',
          to: [cleanEmail],
          subject: subject || `كود التحقق (OTP): ${otp} - متجر Rosée`,
          html: htmlContent
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return res.status(200).json({ success: true, provider: 'resend', data });
      } else {
        console.error('Resend delivery failed:', data);
        // If SMTP is not provided, return the Resend failure immediately
        if (!smtp && !process.env.SMTP_HOST) {
          return res.status(502).json({
            error: 'فشل إرسال البريد عبر Resend',
            details: data?.message || data
          });
        }
      }
    } catch (err: any) {
      console.error('Resend API exception:', err);
      if (!smtp && !process.env.SMTP_HOST) {
        return res.status(500).json({ error: err.message });
      }
    }
  }

  // 2. Try SMTP via Nodemailer (Gmail SMTP, hostinger, custom SMTP)
  const smtpHost = smtp?.host || process.env.SMTP_HOST;
  const smtpUser = smtp?.user || process.env.SMTP_USER;
  const smtpPass = smtp?.pass || process.env.SMTP_PASS;
  const smtpPort = Number(smtp?.port || process.env.SMTP_PORT || 465);
  const smtpSecure = smtp?.secure !== undefined ? Boolean(smtp.secure) : (smtpPort === 465);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: senderEmail || process.env.SMTP_FROM || `"Rosée Security" <${smtpUser}>`,
        to: cleanEmail,
        subject: subject || `كود التحقق (OTP): ${otp} - متجر Rosée`,
        html: htmlContent
      });

      return res.status(200).json({ success: true, provider: 'smtp', messageId: info.messageId });
    } catch (err: any) {
      console.error('SMTP delivery error:', err);
      return res.status(502).json({
        error: 'فشل إرسال البريد عبر SMTP',
        details: err.message
      });
    }
  }

  // 3. Neither service is configured: inform with actionable error
  return res.status(503).json({
    success: false,
    error: 'EMAIL_SERVICE_NOT_CONFIGURED',
    message: 'لم يتم ربط مفتاح خدمة إرسال البريد (Resend API Key) أو إعدادات SMTP في النظام بعد. يرجى تفعيله في لوحة الإدارة حتى يتم إرسال الإيميلات الحقيقية إلى صندوق الوارد مباشرة.'
  });
}
