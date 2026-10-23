import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Logo } from './Logo';
import { usePwa } from '../context/PwaContext';
import { useApp } from '../context/AppContext';

export const PwaInstallBanner: React.FC = () => {
  const { canShowAutoPrompt, isStandalone, isIos, promptInstall, dismissInstallPrompt, setShowIosGuide } = usePwa();
  const { language } = useApp();
  const [delayedVisible, setDelayedVisible] = useState(false);

  const bm = language === 'bm';

  // Wait 12 seconds of active user dashboard engagement before showing prompt
  useEffect(() => {
    if (!canShowAutoPrompt || isStandalone) {
      setDelayedVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setDelayedVisible(true);
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [canShowAutoPrompt, isStandalone]);

  if (!delayedVisible || isStandalone || !canShowAutoPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      setDelayedVisible(false);
    } else {
      await promptInstall();
      setDelayedVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setDelayedVisible(false);
  };

  return (
    <div className="pwa-install-banner" role="region" aria-label="Install Terra Guard App">
      <div className="pwa-install-banner__content">
        <Logo size={42} variant="badge" />
        <div className="pwa-install-banner__text">
          <div className="pwa-install-banner__title">
            <Smartphone size={13} className="pwa-install-banner__icon" />
            <span>{bm ? 'Pasang Aplikasi Terra Guard V2' : 'Install Terra Guard V2'}</span>
          </div>
          <p className="pwa-install-banner__desc">
            {bm
              ? 'Akses serta-merta tanpa talian, amaran pantas, dan fungsi SOS skrin penuh.'
              : 'Fast offline access, full-screen emergency kit, and 1-tap SOS.'}
          </p>
        </div>
      </div>

      <div className="pwa-install-banner__actions">
        <button
          type="button"
          className="pwa-install-btn"
          onClick={handleInstallClick}
        >
          <Download size={14} />
          <span>{isIos ? (bm ? 'Panduan Pasang iOS' : 'Add to Home Screen') : (bm ? 'Pasang Sekarang' : 'Install App')}</span>
        </button>

        <button
          type="button"
          className="pwa-install-dismiss"
          onClick={handleDismiss}
          aria-label={bm ? 'Nanti' : 'Dismiss'}
        >
          <X size={14} />
          <span>{bm ? 'Nanti' : 'Later'}</span>
        </button>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
