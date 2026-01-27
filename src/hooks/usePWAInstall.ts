import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  install: () => Promise<boolean>;
}

// Detect if running as installed PWA
function isRunningStandalone(): boolean {
  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // iOS Safari specific check
  if ('standalone' in window.navigator) {
    return (window.navigator as Navigator & { standalone: boolean }).standalone;
  }

  // Check if launched from home screen
  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
}

// Detect iOS
function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

// Detect Android
function isAndroidDevice(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone] = useState(isRunningStandalone);
  const [isIOS] = useState(isIOSDevice);
  const [isAndroid] = useState(isAndroidDevice);

  useEffect(() => {
    // Check if already installed
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferred prompt
    setDeferredPrompt(null);

    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    isInstallable: deferredPrompt !== null,
    isInstalled: isInstalled || isStandalone,
    isIOS,
    isAndroid,
    isStandalone,
    install,
  };
}
