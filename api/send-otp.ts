import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  // 2. Resolve Resend API Key (Request Body -> Env Vars -> Firebase Realtime DB)
  let effectiveResendKey = (resendApiKey && String(resendApiKey).trim()) ||
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY;

  if (!effectiveResendKey) {
    try {
      const fbRes = await fetch('https://rosee-erp-default-rtdb.firebaseio.com/rosee_data/settings/resendApiKey.json');
      if (fbRes.ok) {
        const val = await fbRes.json();
        if (val && typeof val === 'string' && val.trim()) {
          effectiveResendKey = val.trim();
        }
      }
    } catch (e) {
      console.warn('Could not fetch resendApiKey from Firebase:', e);
    }
  }

  // 3. Resolve Sender Email
  let effectiveSender = senderEmail?.trim() || process.env.RESEND_FROM_EMAIL;
  if (!effectiveSender) {
    try {
      const fbSenderRes = await fetch('https://rosee-erp-default-rtdb.firebaseio.com/rosee_data/settings/resendSenderEmail.json');
      if (fbSenderRes.ok) {
        const val = await fbSenderRes.json();
        if (val && typeof val === 'string' && val.trim()) {
          effectiveSender = val.trim();
        }
      }
    } catch (_) {}
  }
  if (!effectiveSender) {
    effectiveSender = 'Rosée Security <onboarding@resend.dev>';
  }

  // 4. Try Resend Delivery
  if (effectiveResendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveResendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: effectiveSender,
          to: [cleanEmail],
          subject: subject || `كود التحقق (OTP): ${otp} - متجر Rosée`,
          html: htmlContent
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return res.status(200).json({
          success: true,
          provider: 'resend',
          id: data.id || 'sent',
          message: 'تم إرسال كود التحقق بنجاح إلى البريد الإلكتروني.'
        });
      } else {
        if (data?.message && (data.message.includes('only send testing emails') || data.message.includes('resend.com/domains'))) {
          // Extract the allowed owner email from the error message (e.g. mimomd199@gmail.com)
          const match = data.message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          const ownerEmail = match ? match[1] : 'mimomd199@gmail.com';

          const fallbackRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${effectiveResendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: effectiveSender,
              to: [ownerEmail],
              subject: `كود التحقق (OTP) لحساب ${userName || cleanEmail} - متجر Rosée`,
              html: `
                <div style="direction:rtl;padding:25px;background:#141414;color:#fff;border-radius:16px;border:1px solid #C5A059;font-family:sans-serif;">
                  <h2 style="color:#C5A059;margin-top:0;">متجر Rosée</h2>
                  <p>طلب استعادة كلمة المرور للمستخدم: <strong>${userName || 'المستخدم'}</strong> (${cleanEmail})</p>
                  <p>كود التحقق (OTP) هو:</p>
                  <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#C5A059;padding:15px;background:#000;text-align:center;border-radius:12px;margin:15px 0;">
                    ${otp}
                  </div>
                  <p style="font-size:12px;color:#888;">
                    ⏳ صالح لمدة 15 دقيقة.<br>
                    💡 <em>ملاحظة: تم إرسال الرسالة إلى بريدك الأساسي (${ownerEmail}) لأن حساب Resend التجريبي يرسل لبريدك المسجل فقط حتى يتم توثيق دومين مخصص.</em>
                  </p>
                </div>
              `
            })
          });

          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json().catch(() => ({}));
            return res.status(200).json({
              success: true,
              provider: 'resend',
              id: fbData.id || 'sent',
              deliveredTo: ownerEmail,
              message: `تم إرسال كود التحقق بنجاح إلى بريدك المعتمد في Resend (${ownerEmail}).`
            });
          }
        }

        console.error('Resend delivery failed:', data);
        if (!smtp && !process.env.SMTP_HOST) {
          return res.status(502).json({
            success: false,
            error: 'فشل إرسال البريد عبر Resend',
            message: data?.message || 'تعذر إرسال البريد عبر خدمة Resend. يرجى التأكد من صحة المفتاح.',
            details: data
          });
        }
      }
    } catch (err: any) {
      console.error('Resend API exception:', err);
      if (!smtp && !process.env.SMTP_HOST) {
        return res.status(500).json({
          success: false,
          error: 'خطأ أثناء الاتصال بخدمة Resend',
          message: err.message
        });
      }
    }
  }

  // 5. Try SMTP via Nodemailer
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
        from: effectiveSender || `"Rosée Security" <${smtpUser}>`,
        to: cleanEmail,
        subject: subject || `كود التحقق (OTP): ${otp} - متجر Rosée`,
        html: htmlContent
      });

      return res.status(200).json({
        success: true,
        provider: 'smtp',
        messageId: info.messageId,
        message: 'تم إرسال كود التحقق بنجاح عبر خادم SMTP.'
      });
    } catch (err: any) {
      console.error('SMTP delivery error:', err);
      return res.status(502).json({
        success: false,
        error: 'فشل إرسال البريد عبر SMTP',
        message: err.message
      });
    }
  }

  // 6. No email provider active
  return res.status(503).json({
    success: false,
    error: 'EMAIL_SERVICE_NOT_CONFIGURED',
    message: 'لم يتم العثور على مفتاح خدمة البريد في النظام. يرجى التأكد من حفظ المفتاح في لوحة التحكم.'
  });
}
