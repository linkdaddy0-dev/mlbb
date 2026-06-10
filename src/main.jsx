import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register standard PWA service worker caching (bypass in Capacitor native environments)
if ('serviceWorker' in navigator) {
  if (window.Capacitor) {
    // Unregister any active service worker in Capacitor to prevent collision
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister().then((ok) => {
          if (ok) console.log('[Capacitor] Unregistered stale service worker successfully.');
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('MLDraft SW registered:', reg.scope))
        .catch(err => console.warn('MLDraft SW registration failed:', err));
    });
  }
}
