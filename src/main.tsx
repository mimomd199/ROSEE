import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global button click pulse effect across Storefront & Admin
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      'button:not(:disabled), [role="button"]:not([aria-disabled="true"]), .btn-pulse'
    );
    if (target) {
      target.classList.remove('btn-pulsing');
      // Trigger DOM reflow to restart animation reliably on rapid taps
      void target.offsetWidth;
      target.classList.add('btn-pulsing');
      setTimeout(() => {
        target.classList.remove('btn-pulsing');
      }, 500);
    }
  }, { passive: true });
}

createRoot(document.getElementById('root')!).render(<App />);
