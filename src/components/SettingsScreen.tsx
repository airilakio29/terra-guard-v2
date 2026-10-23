import React, { useState } from 'react';
import { 
  User, 
  Palette, 
  LogOut, 
  Edit3, 
  Check, 
  X, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  LogIn, 
  Camera,
  Sliders
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { THEME_REGISTRY } from '../data/themes';
import { PRESET_AVATARS, AvatarDisplay } from './PresetAvatars';
import { AvatarCropper } from './AvatarCropper';
import { Logo } from './Logo';

export const SettingsScreen: React.FC = () => {
  const { 
    language, 
    t, 
    themeId, 
    setThemeId, 
    reduceEffects, 
    setReduceEffects, 
    reduceMotion, 
    setReduceMotion,
    avatarUrl, 
    updateAvatar, 
    displayName, 
    updateDisplayName,
    isSavingProfile
  } = useApp();

  const { user, isGuest, logout } = useAuth();

  // Local UI States
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(displayName);
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload'>('presets');
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Handle Display Name Edit
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    await updateDisplayName(nameInput);
    setIsEditingName(false);
    triggerStatusMessage(language === 'bm' ? 'Nama berjaya dikemaskini' : 'Display name updated');
  };

  const handleCancelName = () => {
    setNameInput(displayName);
    setIsEditingName(false);
  };

  // Helper to show temporary status feedback
  const triggerStatusMessage = (msg: string) => {
    setSaveStatusMessage(msg);
    setTimeout(() => setSaveStatusMessage(null), 3500);
  };

  // Handle Preset Avatar Selection
  const handleSelectPreset = async (presetId: string) => {
    await updateAvatar(presetId);
    triggerStatusMessage(
      language === 'bm' 
        ? 'Avatar pilihan dikemaskini' 
        : 'Preset avatar selected'
    );
  };

  // Handle Cropped Image Save
  const handleCroppedImageSave = async (dataUrl: string) => {
    setShowCropper(false);
    const result = await updateAvatar(dataUrl);
    
    let methodFeedback = t.avatarUpdatedSuccess;
    if (result.method === 'firebase_storage') {
      methodFeedback += language === 'bm' ? ' (Firebase Storage)' : ' (Synced via Firebase Storage)';
    } else if (result.method === 'firestore_data_url') {
      methodFeedback += language === 'bm' ? ' (Disimpan di Firestore)' : ' (Saved to Firestore Profile)';
    } else {
      methodFeedback += language === 'bm' ? ' (Simpanan Tempatan)' : ' (Saved locally)';
    }
    triggerStatusMessage(methodFeedback);
  };

  return (
    <div className="screen-scroll-container settings-screen">
      {/* Screen Header */}
      <div className="screen-header">
        <div className="screen-header__title-group">
          <div className="screen-header__icon" style={{ background: 'var(--brand-surface)', color: 'var(--brand-primary)' }}>
            <Sliders size={22} />
          </div>
          <div>
            <h1 className="screen-header__title">{t.settingsTitle}</h1>
            <p className="screen-header__subtitle">
              {language === 'bm' ? 'Sesuaikan profil, avatar, dan gaya paparan awam anda' : 'Manage your civilian profile, avatar, and visual display'}
            </p>
          </div>
        </div>
      </div>

      {/* Temporary Success Banner */}
      {saveStatusMessage && (
        <div className="save-feedback-banner">
          <Check size={16} />
          <span>{saveStatusMessage}</span>
        </div>
      )}

      {/* ─── 1. Civilian Profile Card ────────────────────────────────────────── */}
      <div className="card settings-card">
        <div className="settings-card__header">
          <div className="settings-card__title-group">
            <User size={18} color="var(--brand-primary)" />
            <h2 className="settings-card__title">{t.profileSection}</h2>
          </div>
          {isGuest ? (
            <span className="badge badge--advisory">Guest Mode</span>
          ) : (
            <span className="badge badge--safe">Verified Civilian</span>
          )}
        </div>

        {/* Guest Warning / Upgrade Callout */}
        {isGuest && (
          <div className="guest-upgrade-banner">
            <div className="guest-upgrade-banner__icon">
              <Info size={18} color="var(--advisory-accent)" />
            </div>
            <div className="guest-upgrade-banner__content">
              <strong>{t.guestNoticeTitle}</strong>
              <p>{t.guestNoticeDesc}</p>
              <button 
                type="button" 
                className="btn-guest-signin"
                onClick={() => void logout()}
              >
                <LogIn size={14} style={{ marginRight: '6px' }} />
                {t.signInToSync}
              </button>
            </div>
          </div>
        )}

        {/* Profile Main View */}
        <div className="profile-hero">
          <div className="profile-hero__avatar-col">
            <div className="profile-hero__avatar-wrapper">
              <AvatarDisplay avatarUrl={avatarUrl} name={displayName} size={80} />
              <button 
                type="button"
                className="profile-hero__avatar-edit-badge"
                onClick={() => setAvatarTab(avatarTab === 'presets' ? 'upload' : 'presets')}
                title={t.avatarOptionsTitle}
                aria-label={t.avatarOptionsTitle}
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          <div className="profile-hero__details-col">
            {/* Display Name Row */}
            <div className="profile-field">
              <label className="profile-field__label">{t.displayNameLabel}</label>
              {isEditingName ? (
                <div className="profile-field__edit-group">
                  <input
                    type="text"
                    value={nameInput}
                    maxLength={32}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="profile-field__input"
                    placeholder="Enter civilian name"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="btn-icon-save" 
                    onClick={handleSaveName}
                    disabled={isSavingProfile || !nameInput.trim()}
                    title={t.save}
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="btn-icon-cancel" 
                    onClick={handleCancelName}
                    title={t.cancel}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="profile-field__value-row">
                  <span className="profile-field__value">{displayName}</span>
                  <button 
                    type="button" 
                    className="btn-inline-edit"
                    onClick={() => {
                      setNameInput(displayName);
                      setIsEditingName(true);
                    }}
                    title={t.editDisplayName}
                  >
                    <Edit3 size={14} />
                    <span>{t.editDisplayName}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Email Row */}
            <div className="profile-field">
              <label className="profile-field__label">{t.emailLabel}</label>
              <span className="profile-field__value profile-field__value--subtle">
                {user?.email || t.guestEmailPlaceholder}
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out Action Button */}
        <div className="profile-actions-bar">
          <button 
            type="button" 
            className="btn-signout"
            onClick={() => void logout()}
          >
            <LogOut size={16} style={{ marginRight: '6px' }} />
            {t.signOutBtn}
          </button>
        </div>
      </div>

      {/* ─── 2. Avatar Customization Area ────────────────────────────────────── */}
      <div className="card settings-card">
        <div className="settings-card__header">
          <div className="settings-card__title-group">
            <Sparkles size={18} color="var(--brand-primary)" />
            <h2 className="settings-card__title">{t.avatarOptionsTitle}</h2>
          </div>
        </div>

        {/* Tab switch between Preset Avatars and Upload Custom Photo */}
        <div className="avatar-tab-pills">
          <button 
            type="button"
            className={`avatar-tab-pill ${avatarTab === 'presets' ? 'active' : ''}`}
            onClick={() => setAvatarTab('presets')}
          >
            {t.presetAvatarsTab}
          </button>
          <button 
            type="button"
            className={`avatar-tab-pill ${avatarTab === 'upload' ? 'active' : ''}`}
            onClick={() => setAvatarTab('upload')}
          >
            {t.uploadAvatarTab}
          </button>
        </div>

        {/* Tab 1: 12 Preset Friendly Avatars */}
        {avatarTab === 'presets' && (
          <div className="preset-avatars-section">
            <p className="settings-section-hint">{t.choosePresetHint}</p>
            <div className="preset-avatars-grid">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.id;
                const PresetComponent = preset.Component;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-avatar-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                    title={language === 'bm' ? preset.nameBm : preset.nameEn}
                  >
                    <div className="preset-avatar-btn__visual">
                      <PresetComponent size={52} />
                      {isSelected && (
                        <div className="preset-avatar-check">
                          <Check size={12} color="var(--text-inverse)" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="preset-avatar-btn__name">
                      {language === 'bm' ? preset.nameBm : preset.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Upload & Circular Cropper */}
        {avatarTab === 'upload' && (
          <div className="upload-avatar-section">
            <p className="settings-section-hint">{t.uploadHint}</p>
            <div className="upload-cta-box">
              <Upload size={32} color="var(--brand-primary)" />
              <p className="upload-cta-box__text">
                {language === 'bm' 
                  ? 'Muat naik foto anda untuk dipotong secara segiempat dengan peluncur zum dan seret.'
                  : 'Upload your photo and crop to a neat square with zoom & pan adjustments.'}
              </p>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => setShowCropper(true)}
              >
                <Upload size={16} style={{ marginRight: '6px' }} />
                {t.openCropperBtn}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Appearance & Theme Picker ───────────────────────────────────── */}
      <div className="card settings-card">
        <div className="settings-card__header">
          <div className="settings-card__title-group">
            <Palette size={18} color="var(--brand-primary)" />
            <div>
              <h2 className="settings-card__title">{t.themeSection}</h2>
              <p className="settings-card__desc">{t.themeSectionSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Live Mini Preview Theme Cards (Data-driven Registry) */}
        <div className="theme-cards-list">
          {THEME_REGISTRY.map((theme) => {
            const isSelected = themeId === theme.id;
            return (
              <div 
                key={theme.id}
                className={`theme-card ${isSelected ? 'theme-card--active' : ''}`}
                onClick={() => setThemeId(theme.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setThemeId(theme.id);
                  }
                }}
              >
                {/* Live Mini Preview Box */}
                <div 
                  className="theme-card__preview"
                  style={{
                    backgroundColor: theme.preview.bgCanvas,
                    borderColor: theme.preview.borderSubtle,
                  }}
                >
                  <div 
                    className="theme-card__preview-surface"
                    style={{
                      backgroundColor: theme.preview.bgSurface,
                      borderColor: theme.preview.borderSubtle,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div 
                        className="theme-card__preview-badge"
                        style={{ backgroundColor: theme.preview.brandPrimary }}
                      />
                      <div 
                        style={{ 
                          width: '5px', 
                          height: '5px', 
                          borderRadius: '1px', 
                          backgroundColor: theme.preview.accentColor 
                        }} 
                      />
                    </div>
                    <div 
                      className="theme-card__preview-line"
                      style={{ backgroundColor: theme.preview.textPrimary }}
                    />
                    <div 
                      className="theme-card__preview-line theme-card__preview-line--short"
                      style={{ backgroundColor: theme.colors['--text-muted'] }}
                    />
                  </div>
                </div>

                {/* Theme Info */}
                <div className="theme-card__content">
                  <div className="theme-card__name-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="theme-card__name">
                        {language === 'bm' ? theme.nameBm : theme.nameEn}
                      </span>
                      <span className={`theme-mode-pill ${theme.mode}`}>
                        {theme.mode === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="badge badge--safe" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {t.activeThemeBadge}
                      </span>
                    )}
                  </div>

                  <p className="theme-card__desc">
                    {language === 'bm' ? theme.descriptionBm : theme.descriptionEn}
                  </p>

                  <div className="theme-card__effect-tag">
                    {theme.floatingEffect.type === 'droplets' && (language === 'bm' ? '💧 Titisan Air & Suar' : '💧 Droplets & Beacon')}
                    {theme.floatingEffect.type === 'rain-clouds' && (language === 'bm' ? '🌧️ Hujan Rintik & Awan' : '🌧️ Rain Streaks & Clouds')}
                    {theme.floatingEffect.type === 'golden-leaves' && (language === 'bm' ? '🍃 Titik Emas & Dedaun' : '🍃 Golden Dots & Soft Leaves')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Preference Toggles */}
        <div className="appearance-toggles-group">
          {/* Reduce Background Effects */}
          <div className="appearance-toggle-item">
            <div className="appearance-toggle-item__text">
              <label htmlFor="toggle-reduce-effects" className="appearance-toggle-item__label">
                {t.reduceEffectsLabel}
              </label>
              <p className="appearance-toggle-item__desc">{t.reduceEffectsDesc}</p>
            </div>
            <label className="switch-control">
              <input 
                id="toggle-reduce-effects"
                type="checkbox"
                checked={reduceEffects}
                onChange={(e) => setReduceEffects(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Reduce Motion Override */}
          <div className="appearance-toggle-item">
            <div className="appearance-toggle-item__text">
              <label htmlFor="toggle-reduce-motion" className="appearance-toggle-item__label">
                {t.reduceMotionLabel}
              </label>
              <p className="appearance-toggle-item__desc">{t.reduceMotionDesc}</p>
            </div>
            <label className="switch-control">
              <input 
                id="toggle-reduce-motion"
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        {/* Critical Safety Guarantee Callout */}
        <div className="safety-guarantee-box">
          <div className="safety-guarantee-box__icon">
            <ShieldCheck size={20} color="var(--safe-accent)" />
          </div>
          <div className="safety-guarantee-box__text">
            <strong>{t.safetyGuaranteeTitle}</strong>
            <p>{t.safetyGuaranteeDesc}</p>
          </div>
        </div>

        {/* Official Application Card with Central Logo */}
        <div 
          style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: 'var(--radius-none)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <Logo size={48} variant="badge" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
              Terra Guard V2
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {language === 'bm'
                ? 'Edisi Rasmi Hackathon Sime Darby • Teman Bencana Awam'
                : 'Sime Darby Hackathon Edition • Citizen Disaster Companion'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Image Cropper Modal (when activated) ────────────────────────── */}
      {showCropper && (
        <AvatarCropper
          language={language}
          onSave={handleCroppedImageSave}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
};
