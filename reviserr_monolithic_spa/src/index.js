import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure root node has tabIndex for SPA accessibility focus
const rootEl = document.getElementById('root');
if (rootEl) rootEl.setAttribute('tabindex', '-1');

const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If CRA: optionally register service worker
if ('serviceWorker' in navigator) {
  // register for offline/PWA
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
