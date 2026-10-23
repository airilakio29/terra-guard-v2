import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { usePwa } from '../context/PwaContext';
import { useApp } from '../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = usePwa();
  const { language } = useApp();
  const [showRestored, setShowRestored] = useState(false);
  const [dismissedOffline, setDismissedOffline] = useState(false);

  const bm = language === 'bm';

  // Show "Back Online" badge for 3.5s when network recovers
  useEffect(() => {
    if (isOnline) {
      setDismissedOffline(false);
      setShowRestored(true);
      const timer = window.setTimeout(() => setShowRestored(false), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showRestored) {
    return null;
  }

  if (!isOnline && dismissedOffline) {
    return null;
  }

  return (
    <aside
      className={`offline-banner ${isOnline ? 'offline-banner--restored' : 'offline-banner--active'}`}
      role="status"
      aria-live="polite"
    >
      <div className="offline-banner__inner">
        <div className="offline-banner__content">
          {isOnline ? (
            <>
              <Wifi size={14} className="offline-banner__icon offline-banner__icon--restored" />
              <span className="offline-banner__text">
                <strong>{bm ? 'Rangkaian Pulih' : 'Back Online'}</strong> &bull;{' '}
                {bm ? 'Suapan cuaca & pangkalan data kembali bersambung.' : 'Live weather & relief feeds reconnected.'}
              </span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="offline-banner__icon" />
              <span className="offline-banner__text">
                <strong>{bm ? 'Mod Luar Talian' : 'Offline Mode'}</strong> &bull;{' '}
                {bm
                  ? 'Kit kecemasan, panduan hidup, pusat PPS & talian 999 kekal aktif.'
                  : 'Emergency kit, survival guides, shelters & hotlines remain fully accessible.'}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          className="offline-banner__close"
          onClick={() => {
            if (isOnline) setShowRestored(false);
            else setDismissedOffline(true);
          }}
          aria-label={bm ? 'Tutup makluman' : 'Dismiss notice'}
        >
          <X size={13} />
        </button>
      </div>
    </aside>
  );
};

export default OfflineBanner;
