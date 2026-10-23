import React, { useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type AuthError,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  Heart,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { Logo } from './Logo';
import { GoogleIcon } from './GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthMode = 'signin' | 'signup';

type HazardVulnerability =
  | 'flood'
  | 'earthquake'
  | 'wildfire'
  | 'none';

interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  homeAddress: string;
  hazardVulnerability: HazardVulnerability;
  medicalNotes: string;
}

interface SignInFormData {
  email: string;
  password: string;
}

// ─── Firebase error → human-readable message ─────────────────────────────────

function parseAuthError(error: AuthError, lang: 'en' | 'bm' = 'en'): string {
  const isBm = lang === 'bm';
  switch (error.code) {
    case 'auth/email-already-in-use':
      return isBm
        ? 'E-mel ini telah didaftarkan. Sila log masuk.'
        : 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return isBm
        ? 'Sila masukkan alamat e-mel yang sah.'
        : 'Please enter a valid email address.';
    case 'auth/weak-password':
      return isBm
        ? 'Kata laluan mestilah sekurang-kurangnya 6 aksara.'
        : 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isBm
        ? 'E-mel atau kata laluan tidak sah. Sila cuba lagi.'
        : 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return isBm
        ? 'Terlalu banyak percubaan gagal. Sila tunggu sebentar dan cuba lagi.'
        : 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return isBm
        ? 'Ralat rangkaian. Sila semak sambungan internet anda (mod Tetamu sentiasa sedia).'
        : 'Network error. Please check your connection (Guest mode is always available).';
    default:
      return error.message || (isBm ? 'Ralat tidak dijangka berlaku.' : 'An unexpected error occurred. Please try again.');
  }
}

function parseGoogleAuthError(error: { code?: string; message?: string }, lang: 'en' | 'bm' = 'en'): string | null {
  const isBm = lang === 'bm';
  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      // User cancelled or closed the pop-up: show no scary error banner
      return null;
    case 'auth/popup-blocked':
      return isBm
        ? 'Tetingkap timbul log masuk disekat oleh pelayar anda. Mengalihkan ke mod log masuk penuh...'
        : 'Sign-in pop-up was blocked by your browser. Redirecting...';
    case 'auth/network-request-failed':
      return isBm
        ? 'Sambungan rangkaian gagal. Sila semak internet anda dan cuba lagi (Akses Tetamu juga sedia ada).'
        : 'Network connection failed. Please check your internet connection and try again (Guest access is also available).';
    case 'auth/account-exists-with-different-credential':
      return isBm
        ? 'Akaun sudah wujud dengan e-mel ini menggunakan kaedah log masuk berbeza. Sila log masuk dengan e-mel dan kata laluan asal anda.'
        : 'An account already exists with this email using a different sign-in method. Please sign in with your original email and password.';
    case 'auth/unauthorized-domain': {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      return isBm
        ? `Domain '${currentHost}' belum dibenarkan untuk Log Masuk Google. Sila tambahkan '${currentHost}' ke 'Authorized domains' dalam Firebase Console > Authentication > Settings.`
        : `This domain ('${currentHost}') is not authorized for Google Sign-In. Please add '${currentHost}' to 'Authorized domains' in Firebase Console > Authentication > Settings (or run on http://localhost:5173).`;
    }
    case 'auth/operation-not-allowed':
      return isBm
        ? 'Pembekal Google belum diaktifkan dalam Firebase Authentication Console.'
        : 'Google provider is not enabled in Firebase Authentication Console.';
    default:
      return error.message || (isBm ? 'Ralat log masuk Google berlaku.' : 'Google sign-in could not be completed.');
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id, label, type = 'text', value, onChange, placeholder, icon,
  required, disabled, rightSlot, autoComplete,
}) => (
  <div className="auth-field">
    <label htmlFor={id} className="auth-field__label">
      {label}
      {required && <span className="auth-field__required" aria-hidden>*</span>}
    </label>
    <div className="auth-field__wrap">
      <span className="auth-field__icon" aria-hidden>{icon}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="auth-field__input"
      />
      {rightSlot}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Auth: React.FC = () => {
  const { loginAsGuest, signInWithGoogle, resetPassword } = useAuth();
  const { language } = useApp();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign-in form state
  const [siForm, setSiForm] = useState<SignInFormData>({ email: '', password: '' });

  // Sign-up form state
  const [suForm, setSuForm] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    homeAddress: '',
    hazardVulnerability: 'none',
    medicalNotes: '',
  });

  const switchMode = useCallback((next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  // ── Google Sign In ─────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Auth state observer handles redirection into main layout
    } catch (err) {
      const parsed = parseGoogleAuthError(err as AuthError, language);
      if (parsed) {
        setError(parsed);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    const emailToReset = siForm.email.trim();
    if (!emailToReset) {
      setError(
        language === 'bm'
          ? 'Sila masukkan alamat e-mel anda dahulu di atas, kemudian tekan Lupa kata laluan.'
          : 'Please enter your email address in the field above first, then click Forgot password.'
      );
      return;
    }

    setLoading(true);
    try {
      await resetPassword(emailToReset);
      setSuccess(
        language === 'bm'
          ? `Pautan penetapan semula kata laluan telah dihantar ke ${emailToReset}. Sila semak peti masuk anda.`
          : `Password reset link sent to ${emailToReset}. Please check your inbox.`
      );
    } catch (err) {
      setError(parseAuthError(err as AuthError, language));
    } finally {
      setLoading(false);
    }
  };

  // ── Sign In ────────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, siForm.email.trim(), siForm.password);
      // AuthContext listener in App.tsx will handle redirect
    } catch (err) {
      setError(parseAuthError(err as AuthError, language));
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!suForm.fullName.trim()) {
      setError(language === 'bm' ? 'Nama penuh diperlukan.' : 'Full name is required.');
      return;
    }
    if (suForm.password !== suForm.confirmPassword) {
      setError(language === 'bm' ? 'Kata laluan tidak sepadan.' : 'Passwords do not match.');
      return;
    }
    if (suForm.password.length < 6) {
      setError(language === 'bm' ? 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        suForm.email.trim(),
        suForm.password,
      );

      const savedTheme = localStorage.getItem('terra_guard_theme') || 'terra-classic';

      // Save extended profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: suForm.fullName.trim(),
        phoneNumber: suForm.phoneNumber.trim(),
        homeAddress: suForm.homeAddress.trim(),
        hazardVulnerability: suForm.hazardVulnerability,
        medicalNotes: suForm.medicalNotes.trim(),
        themeId: savedTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'citizen',
      });

      setSuccess(
        language === 'bm'
          ? 'Akaun berjaya dicipta! Mengalihkan ke papan pemuka...'
          : 'Account created! Redirecting to your dashboard\u2026'
      );
    } catch (err) {
      setError(parseAuthError(err as AuthError, language));
    } finally {
      setLoading(false);
    }
  };

  const hazardOptions: { value: HazardVulnerability; label: string; emoji: string }[] = [
    {
      value: 'flood',
      label: language === 'bm' ? 'Zon Mudah Banjir' : 'Flood-prone zone',
      emoji: '\uD83C\uDF0A'
    },
    {
      value: 'earthquake',
      label: language === 'bm' ? 'Zon Gegaran / Gempa' : 'Earthquake zone',
      emoji: '\uD83C\uDFDA\uFE0F'
    },
    {
      value: 'wildfire',
      label: language === 'bm' ? 'Kawasan Kebakaran Hutan' : 'Wildfire area',
      emoji: '\uD83D\uDD25'
    },
    {
      value: 'none',
      label: language === 'bm' ? 'Tiada / Tidak Pasti' : 'None / Not sure',
      emoji: '\u2705'
    },
  ];

  const isAnyLoading = loading || googleLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-bg" aria-hidden>
        <div className="auth-bg__blob auth-bg__blob--1" />
        <div className="auth-bg__blob auth-bg__blob--2" />
        <div className="auth-bg__blob auth-bg__blob--3" />
      </div>

      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <Logo size={60} variant="badge" style={{ marginBottom: '8px' }} language={language} />
          <h1 className="auth-title">TerraGuard</h1>
          <p className="auth-subtitle">
            {language === 'bm' ? 'Teman Keselamatan Bencana Awam' : 'Citizen Disaster Companion'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button
            role="tab"
            aria-selected={mode === 'signin'}
            id="tab-signin"
            className={`auth-toggle__btn ${mode === 'signin' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => switchMode('signin')}
            disabled={isAnyLoading}
          >
            {language === 'bm' ? 'Log Masuk' : 'Sign In'}
          </button>
          <button
            role="tab"
            aria-selected={mode === 'signup'}
            id="tab-signup"
            className={`auth-toggle__btn ${mode === 'signup' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => switchMode('signup')}
            disabled={isAnyLoading}
          >
            {language === 'bm' ? 'Cipta Akaun' : 'Create Account'}
          </button>
          <div className={`auth-toggle__indicator ${mode === 'signup' ? 'auth-toggle__indicator--right' : ''}`} aria-hidden />
        </div>

        {/* Error banner */}
        {error && (
          <div className="auth-alert auth-alert--error" role="alert" aria-live="assertive">
            <AlertTriangle size={16} strokeWidth={2.5} />
            <span>{error}</span>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="auth-alert auth-alert--success" role="alert" aria-live="polite">
            <CheckCircle2 size={16} strokeWidth={2.5} />
            <span>{success}</span>
          </div>
        )}

        {/* ── SIGN IN FORM ────────────────────────────────────────────────── */}
        {mode === 'signin' && (
          <form
            id="form-signin"
            className="auth-form"
            onSubmit={handleSignIn}
            noValidate
            aria-labelledby="tab-signin"
          >
            <InputField
              id="si-email"
              label={language === 'bm' ? 'Alamat e-mel' : 'Email address'}
              type="email"
              value={siForm.email}
              onChange={v => setSiForm(f => ({ ...f, email: v }))}
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              required
              disabled={isAnyLoading}
              autoComplete="email"
            />

            <div className="auth-field">
              <label htmlFor="si-password" className="auth-field__label">
                {language === 'bm' ? 'Kata Laluan' : 'Password'}
                <span className="auth-field__required" aria-hidden>*</span>
              </label>
              <div className="auth-field__wrap">
                <span className="auth-field__icon" aria-hidden><Lock size={16} /></span>
                <input
                  id="si-password"
                  type={showPassword ? 'text' : 'password'}
                  value={siForm.password}
                  onChange={e => setSiForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  disabled={isAnyLoading}
                  autoComplete="current-password"
                  className="auth-field__input"
                />
                <button
                  type="button"
                  className="auth-field__eye"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Forgot password link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={handleForgotPassword}
                  disabled={isAnyLoading}
                >
                  {language === 'bm' ? 'Lupa kata laluan?' : 'Forgot password?'}
                </button>
              </div>
            </div>

            <button
              id="btn-signin"
              type="submit"
              className="auth-submit"
              disabled={isAnyLoading}
            >
              {loading
                ? <><Loader2 size={18} className="auth-submit__spinner" /> {language === 'bm' ? 'Sedang log masuk...' : 'Signing in\u2026'}</>
                : <><span>{language === 'bm' ? 'Log Masuk' : 'Sign In'}</span><ArrowRight size={18} /></>
              }
            </button>

            {/* Google Sign-in divider */}
            <div className="auth-divider">
              <span>{language === 'bm' ? 'atau' : 'or'}</span>
            </div>

            {/* Continue with Google button */}
            <button
              id="btn-google-signin"
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <Loader2 size={18} className="auth-google-btn__spinner" />
              ) : (
                <GoogleIcon size={18} />
              )}
              <span>{language === 'bm' ? 'Teruskan dengan Google' : 'Continue with Google'}</span>
            </button>

            {/* Instant emergency access divider */}
            <div className="auth-divider">
              <span>{language === 'bm' ? 'atau akses kecemasan segera' : 'or instant emergency access'}</span>
            </div>

            {/* Continue as guest button */}
            <button
              id="btn-guest-login"
              type="button"
              className="auth-guest-btn"
              onClick={loginAsGuest}
              disabled={isAnyLoading}
            >
              <UserCheck size={18} color="var(--brand-primary)" />
              <span>{language === 'bm' ? 'Teruskan sebagai Tetamu' : 'Continue as Guest'}</span>
            </button>

            <p className="auth-footer-note">
              {language === 'bm' ? 'Belum mempunyai akaun?' : "Don't have an account?"}{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                {language === 'bm' ? 'Cipta akaun &rarr;' : 'Create one &rarr;'}
              </button>
            </p>
          </form>
        )}

        {/* ── SIGN UP FORM ────────────────────────────────────────────────── */}
        {mode === 'signup' && (
          <form
            id="form-signup"
            className="auth-form"
            onSubmit={handleSignUp}
            noValidate
            aria-labelledby="tab-signup"
          >
            {/* Section: Account */}
            <div className="auth-section-heading">
              <span className="auth-section-icon"><User size={14} /></span>
              {language === 'bm' ? 'Maklumat Akaun' : 'Account Details'}
            </div>

            <InputField
              id="su-fullname"
              label={language === 'bm' ? 'Nama Penuh' : 'Full Name'}
              value={suForm.fullName}
              onChange={v => setSuForm(f => ({ ...f, fullName: v }))}
              placeholder="Alex Razak"
              icon={<User size={16} />}
              required
              disabled={isAnyLoading}
              autoComplete="name"
            />

            <InputField
              id="su-email"
              label={language === 'bm' ? 'Alamat E-mel' : 'Email Address'}
              type="email"
              value={suForm.email}
              onChange={v => setSuForm(f => ({ ...f, email: v }))}
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              required
              disabled={isAnyLoading}
              autoComplete="email"
            />

            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="su-password" className="auth-field__label">
                  {language === 'bm' ? 'Kata Laluan' : 'Password'}
                  <span className="auth-field__required" aria-hidden>*</span>
                </label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon" aria-hidden><Lock size={16} /></span>
                  <input
                    id="su-password"
                    type={showPassword ? 'text' : 'password'}
                    value={suForm.password}
                    onChange={e => setSuForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 chars"
                    required
                    disabled={isAnyLoading}
                    autoComplete="new-password"
                    className="auth-field__input"
                  />
                  <button
                    type="button"
                    className="auth-field__eye"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="su-confirm" className="auth-field__label">
                  {language === 'bm' ? 'Sahkan Kata Laluan' : 'Confirm Password'}
                  <span className="auth-field__required" aria-hidden>*</span>
                </label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon" aria-hidden><Lock size={16} /></span>
                  <input
                    id="su-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={suForm.confirmPassword}
                    onChange={e => setSuForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter"
                    required
                    disabled={isAnyLoading}
                    autoComplete="new-password"
                    className="auth-field__input"
                  />
                  <button
                    type="button"
                    className="auth-field__eye"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Emergency Contact */}
            <div className="auth-section-heading">
              <span className="auth-section-icon"><Phone size={14} /></span>
              {language === 'bm' ? 'Profil Kecemasan' : 'Emergency Profile'}
            </div>

            <InputField
              id="su-phone"
              label={language === 'bm' ? 'Nombor Telefon' : 'Phone Number'}
              type="tel"
              value={suForm.phoneNumber}
              onChange={v => setSuForm(f => ({ ...f, phoneNumber: v }))}
              placeholder="+60 12-345 6789"
              icon={<Phone size={16} />}
              required
              disabled={isAnyLoading}
              autoComplete="tel"
            />

            <InputField
              id="su-address"
              label={language === 'bm' ? 'Alamat Rumah / Lokasi' : 'Home Address / Location'}
              value={suForm.homeAddress}
              onChange={v => setSuForm(f => ({ ...f, homeAddress: v }))}
              placeholder="No. 12, Jalan Contoh, 50000 KL"
              icon={<MapPin size={16} />}
              required
              disabled={isAnyLoading}
              autoComplete="street-address"
            />

            {/* Hazard Vulnerability */}
            <div className="auth-field">
              <span id="su-hazard" className="auth-field__label">
                {language === 'bm' ? 'Kerentanan Utama Bencana' : 'Primary Hazard Vulnerability'}
                <span className="auth-field__required" aria-hidden>*</span>
              </span>
              <div className="auth-hazard-grid" role="radiogroup" aria-labelledby="su-hazard">
                {hazardOptions.map(opt => (
                  <label
                    key={opt.value}
                    className={`auth-hazard-card ${suForm.hazardVulnerability === opt.value ? 'auth-hazard-card--selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="hazard"
                      value={opt.value}
                      checked={suForm.hazardVulnerability === opt.value}
                      onChange={() => setSuForm(f => ({ ...f, hazardVulnerability: opt.value }))}
                      disabled={isAnyLoading}
                      className="sr-only"
                    />
                    <span className="auth-hazard-card__emoji">{opt.emoji}</span>
                    <span className="auth-hazard-card__label">{opt.label}</span>
                    {suForm.hazardVulnerability === opt.value && (
                      <CheckCircle2 size={14} className="auth-hazard-card__check" strokeWidth={2.5} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Medical Notes */}
            <div className="auth-field">
              <label htmlFor="su-medical" className="auth-field__label">
                <Heart size={14} className="auth-field__label-icon" />
                {language === 'bm' ? 'Nota Kesihatan / Mobiliti' : 'Medical / Mobility Notes'}
                <span className="auth-field__optional">
                  {language === 'bm' ? '(Pilihan)' : '(Optional)'}
                </span>
              </label>
              <textarea
                id="su-medical"
                value={suForm.medicalNotes}
                onChange={e => setSuForm(f => ({ ...f, medicalNotes: e.target.value }))}
                placeholder={
                  language === 'bm'
                    ? 'cth. Pengguna kerusi roda, pesakit diabetes, memerlukan peti sejuk insulin...'
                    : 'e.g. Wheelchair user, diabetic, requires insulin refrigeration\u2026'
                }
                disabled={isAnyLoading}
                rows={3}
                className="auth-field__textarea"
              />
              <p className="auth-field__hint">
                {language === 'bm'
                  ? 'Maklumat ini dikongsi dengan pasukan penyelamat hanya ketika kecemasan bencana.'
                  : 'This information is shared with rescue teams only during an emergency.'}
              </p>
            </div>

            <button
              id="btn-signup"
              type="submit"
              className="auth-submit"
              disabled={isAnyLoading}
            >
              {loading
                ? <><Loader2 size={18} className="auth-submit__spinner" /> {language === 'bm' ? 'Mendaftar...' : 'Creating account\u2026'}</>
                : <><span>{language === 'bm' ? 'Cipta Akaun Saya' : 'Create My Account'}</span><ArrowRight size={18} /></>
              }
            </button>

            {/* Google Sign-in divider */}
            <div className="auth-divider">
              <span>{language === 'bm' ? 'atau' : 'or'}</span>
            </div>

            {/* Continue with Google button */}
            <button
              id="btn-google-signup"
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <Loader2 size={18} className="auth-google-btn__spinner" />
              ) : (
                <GoogleIcon size={18} />
              )}
              <span>{language === 'bm' ? 'Teruskan dengan Google' : 'Continue with Google'}</span>
            </button>

            <p className="auth-footer-note">
              {language === 'bm' ? 'Sudah mempunyai akaun?' : 'Already have an account?'}{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                {language === 'bm' ? 'Log masuk &rarr;' : 'Sign in &rarr;'}
              </button>
            </p>
          </form>
        )}

        {/* Footer branding */}
        <p className="auth-brand-note">
          🛡️ {language === 'bm' ? 'Data anda dilindungi dan hanya digunakan untuk penyelarasan bantuan bencana.' : 'Your data is protected and only used for disaster response coordination.'}
        </p>
      </div>
    </div>
  );
};

export default Auth;
