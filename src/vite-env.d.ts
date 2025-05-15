
/// <reference types="vite/client" />

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Window {
  cordova?: any;
  deferredPrompt: BeforeInstallPromptEvent | null;
}
