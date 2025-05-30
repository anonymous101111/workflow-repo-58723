import { useEffect } from 'react';

// PUBLIC_INTERFACE
// ServiceWorkerReg: Registers a service worker for offline/PWA support.
export default function ServiceWorkerReg() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .catch(() => {});
      });
    }
  }, []);
  return null;
}
