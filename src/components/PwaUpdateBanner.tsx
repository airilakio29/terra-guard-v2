import React, { useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { usePwa } from '../context/PwaContext';
import { useApp } from '../context/AppContext';

export const PwaUpdateBanner: React.FC = () => {
  const { needRefresh, updateApp, isSosActive } = usePwa();
  const { language } = useApp();
  const [dismissed, setDismissed] = useState(false);

  // Never interrupt active SOS actions or survival kit emergencies
  if (!needRefresh || isSosActive || dismissed) {
    return null;
  }

  const bm = language === 'bm';

  return (
    <div
      className="pwa-update-bar"
      role="alert"
      aria-live="polite"
    >
      <div className="pwa-update-bar__content">
        <Sparkles size={14} className="pwa-update-bar__sparkle" />
        <span className="pwa-update-bar__text">
          <strong>{bm ? 'Versi Baru Tersedia' : 'New Version Available'}</strong> &bull;{' '}
          {bm ? 'Muat semula untuk kemas kini keselamatan terkini.' : 'Refresh to apply the latest safety updates.'}
        </span>
      </div>

      <div className="pwa-update-bar__actions">
        <button
          type="button"
          className="pwa-update-btn"
          onClick={() => updateApp()}
        >
          <RefreshCw size={13} />
          <span>{bm ? 'Kemas Kini' : 'Refresh'}</span>
        </button>

        <button
          type="button"
          className="pwa-update-dismiss"
          onClick={() => setDismissed(true)}
          aria-label={bm ? 'Nanti' : 'Later'}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default PwaUpdateBanner;
