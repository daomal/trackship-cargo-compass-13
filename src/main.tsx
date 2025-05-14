
import { createRoot } from 'react-dom/client';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App.tsx';
import './index.css';

// Call this to initialize the PWA elements needed for Capacitor
defineCustomElements(window);

// Initialize the app
const startApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

// Wait for the device to be ready when using Capacitor
if (typeof window !== 'undefined' && 'cordova' in window) {
  document.addEventListener('deviceready', startApp, false);
} else {
  startApp();
}
