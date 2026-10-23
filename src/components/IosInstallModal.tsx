import React from 'react';
import { Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { Logo } from './Logo';
import { usePwa } from '../context/PwaContext';
import { useApp } from '../context/AppContext';

export const IosInstallModal: React.FC = () => {
  const { showIosGuide, setShowIosGuide } = usePwa();
  const { language } = useApp();

  if (!showIosGuide) return null;

  const bm = language === 'bm';

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      onClick={() => setShowIosGuide(false)}
    >
      <div
        className="modal-dialog ios-install-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ios-install-header">
          <div className="ios-install-header__title-group">
            <Logo size={36} variant="badge" />
            <div>
              <h2 id="ios-install-title" className="ios-install-title">
                {bm ? 'Pasang pada iPhone / iPad' : 'Install on iPhone & iPad'}
              </h2>
              <p className="ios-install-subtitle">
                {bm
                  ? 'Akses pantas skrin penuh tanpa bar carian pelayar'
                  : 'Fast standalone access without browser search bars'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ios-install-close"
            onClick={() => setShowIosGuide(false)}
            aria-label={bm ? 'Tutup panduan' : 'Close guide'}
          >
            <X size={16} />
          </button>
        </div>

        {/* 3-Step Illustrated Guide */}
        <div className="ios-install-steps">
          {/* Step 1 */}
          <div className="ios-step-card">
            <div className="ios-step-badge">1</div>
            <div className="ios-step-content">
              <div className="ios-step-action">
                <Share size={16} className="ios-step-icon" />
                <span>
                  {bm
                    ? 'Tekan butang Kongsi (Share) di bar bawah Safari'
                    : 'Tap the Share button in Safari bottom bar'}
                </span>
              </div>
              <p className="ios-step-desc">
                {bm
                  ? 'Cari ikon kotak beranak panah ke atas di bahagian tengah bar bawah pelayar anda.'
                  : 'Located in the center of the bottom navigation bar in Safari.'}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="ios-step-card">
            <div className="ios-step-badge">2</div>
            <div className="ios-step-content">
              <div className="ios-step-action">
                <PlusSquare size={16} className="ios-step-icon" />
                <span>
                  {bm
                    ? 'Skrol ke bawah & pilih "Tambah ke Skrin Utama"'
                    : 'Scroll and tap "Add to Home Screen"'}
                </span>
              </div>
              <p className="ios-step-desc">
                {bm
                  ? 'Pilih pilihan dengan ikon tambah segiempat dalam senarai tindakan.'
                  : 'Choose the option labeled "Add to Home Screen" with the square plus icon.'}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="ios-step-card">
            <div className="ios-step-badge">3</div>
            <div className="ios-step-content">
              <div className="ios-step-action">
                <CheckCircle2 size={16} className="ios-step-icon ios-step-icon--success" />
                <span>
                  {bm
                    ? 'Tekan "Tambah" (Add) di sudut kanan atas'
                    : 'Tap "Add" in the top-right corner'}
                </span>
              </div>
              <p className="ios-step-desc">
                {bm
                  ? 'Ikon rasmi Terra Guard V2 akan dipasang pada skrin utama peranti anda.'
                  : 'Terra Guard V2 icon will be pinned to your home screen with offline capability.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ios-install-footer">
          <button
            type="button"
            className="ios-install-done-btn"
            onClick={() => setShowIosGuide(false)}
          >
            {bm ? 'Faham & Tutup' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IosInstallModal;
