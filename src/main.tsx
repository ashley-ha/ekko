import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Install prompt handling
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Store the event for later use
  const event = new CustomEvent('installPromptAvailable', { detail: e });
  window.dispatchEvent(event);
});

// Online/offline status
window.addEventListener('online', () => {
  const event = new CustomEvent('connectionChange', { detail: { online: true } });
  window.dispatchEvent(event);
});

window.addEventListener('offline', () => {
  const event = new CustomEvent('connectionChange', { detail: { online: false } });
  window.dispatchEvent(event);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);