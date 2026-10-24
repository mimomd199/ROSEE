import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function devSendOtpPlugin() {
  return {
    name: 'dev-send-otp-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/send-otp', (req: any, res: any) => {
        if (req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              let apiKey = body.resendApiKey || process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
              if (!apiKey) {
                try {
                  const fbRes = await fetch('https://rosee-erp-default-rtdb.firebaseio.com/rosee_data/settings/resendApiKey.json');
                  if (fbRes.ok) {
                    const val = await fbRes.json();
                    if (typeof val === 'string' && val.trim()) apiKey = val.trim();
                  }
                } catch (_) {}
              }

              let sender = body.senderEmail || 'Rosée Security <onboarding@resend.dev>';
              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: sender,
                  to: [body.toEmail],
                  subject: body.subject || `كود التحقق (OTP): ${body.otp} - متجر Rosée`,
                  html: body.htmlContent
                })
              });

              const rData = await resendRes.json().catch(() => ({}));
              res.setHeader('Content-Type', 'application/json');
              if (resendRes.ok) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, provider: 'resend', id: rData.id }));
              } else if (rData?.message && (rData.message.includes('only send testing emails') || rData.message.includes('resend.com/domains'))) {
                const ownerEmail = 'mimomd199@gmail.com';
                const fallbackRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    from: sender,
                    to: [ownerEmail],
                    subject: `كود التحقق (OTP) لحساب ${body.userName || body.toEmail} - متجر Rosée`,
                    html: `
                      <div style="direction:rtl;padding:25px;background:#141414;color:#fff;border-radius:16px;border:1px solid #C5A059;font-family:sans-serif;">
                        <h2 style="color:#C5A059;margin-top:0;">متجر Rosée</h2>
                        <p>طلب استعادة كلمة المرور للمستخدم: <strong>${body.userName || 'المستخدم'}</strong> (${body.toEmail})</p>
                        <p>كود التحقق (OTP) الصادر هو:</p>
                        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#C5A059;padding:15px;background:#000;text-align:center;border-radius:12px;margin:15px 0;">
                          ${body.otp}
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
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    provider: 'resend',
                    id: fbData.id || 'sent',
                    deliveredTo: ownerEmail,
                    message: `تم إرسال كود التحقق بنجاح إلى بريدك المعتمد في Resend (${ownerEmail}).`
                  }));
                } else {
                  res.statusCode = 502;
                  res.end(JSON.stringify({ success: false, error: 'Resend failed', details: rData }));
                }
              } else {
                res.statusCode = 502;
                res.end(JSON.stringify({ success: false, error: 'Resend failed', details: rData }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devSendOtpPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
