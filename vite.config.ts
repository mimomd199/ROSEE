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
