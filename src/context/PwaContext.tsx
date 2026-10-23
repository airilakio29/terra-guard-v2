import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaContextType {
  /** True when browser has active internet connection */
  isOnline: boolean;
  /** True when running inside an installed standalone PWA on Android, iOS, or Desktop */
  isStandalone: boolean;
  /** True if client is on an iOS device (iPhone/iPad) */
  isIos: boolean;
  /** True if app can be installed (Android prompt ready or iOS not in standalone mode) */
  isInstallable: boolean;
  /** Whether the auto install prompt is currently allowed to be displayed */
  canShowAutoPrompt: boolean;
  /** Shows native Android/Desktop install prompt, or opens iOS step-by-step modal */
  promptInstall: () => Promise<boolean>;
  /** Temporarily dismisses the prompt for 7 days */
  dismissInstallPrompt: () => void;
  /** Controls visibility of the iOS Add to Home Screen step-by-step modal */
  showIosGuide: boolean;
  setShowIosGuide: (show: boolean) => void;
  /** Service worker update status */
  needRefresh: boolean;
  /** Triggers service worker activation and page reload */
  updateApp: () => void;
  /** Suppress non-critical update dialogs during acute SOS emergencies */
  isSosActive: boolean;
  setIsSosActive: (active: boolean) => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

const DISMISS_KEY = 'terra_guard_pwa_dismissed_until';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY)) || 0;
      return Date.now() < until;
    } catch {
      return false;
    }
  });

  // Workbox Service Worker Auto-Registration with Prompt
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.info('[PWA] Service Worker registered with scope:', r.scope);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    },
  });

  // Detect iOS device
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Detect Standalone display mode (installed PWA)
  const isStandalone =
    typeof window !== 'undefined' &&
    (isInstalled ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches);

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Chrome/Android beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.info('[PWA] Terra Guard V2 was successfully installed.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissInstallPrompt = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch {
      // ignore
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        } else {
          dismissInstallPrompt();
          return false;
        }
      } catch (err) {
        console.warn('[PWA] Install prompt failed:', err);
        return false;
      }
    } else if (isIos && !isStandalone) {
      setShowIosGuide(true);
      return false;
    }
    return false;
  }, [deferredPrompt, isIos, isStandalone, dismissInstallPrompt]);

  const updateApp = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  const isInstallable = !isStandalone && (Boolean(deferredPrompt) || (isIos && !isStandalone));
  const canShowAutoPrompt = isInstallable && !isDismissed && !isStandalone;

  return (
    <PwaContext.Provider
      value={{
        isOnline,
        isStandalone,
        isIos,
        isInstallable,
        canShowAutoPrompt,
        promptInstall,
        dismissInstallPrompt,
        showIosGuide,
        setShowIosGuide,
        needRefresh,
        updateApp,
        isSosActive,
        setIsSosActive,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = (): PwaContextType => {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error('usePwa must be used within a <PwaProvider>');
  }
  return ctx;
};

export default PwaContext;
