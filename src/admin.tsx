import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';
import './index.css';

// Global button click pulse effect
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      'button:not(:disabled), [role="button"]:not([aria-disabled="true"]), .btn-pulse'
    );
    if (target) {
      target.classList.remove('btn-pulsing');
      void target.offsetWidth;
      target.classList.add('btn-pulsing');
      setTimeout(() => {
        target.classList.remove('btn-pulsing');
      }, 500);
    }
  }, { passive: true });
}

const rootEl = document.getElementById('admin-root');
if (rootEl) {
  createRoot(rootEl).render(<AdminApp />);
}
