import React, { useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type AuthError,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  Shield,
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
import { useAuth } from '../context/AuthContext';

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

function parseAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
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
  const { loginAsGuest } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
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

  // ── Sign In ────────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, siForm.email.trim(), siForm.password);
      // AuthContext listener in App.tsx will handle redirect
    } catch (err) {
      setError(parseAuthError(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!suForm.fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (suForm.password !== suForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (suForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        suForm.email.trim(),
        suForm.password,
      );

      // Save extended profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: suForm.fullName.trim(),
        phoneNumber: suForm.phoneNumber.trim(),
        homeAddress: suForm.homeAddress.trim(),
        hazardVulnerability: suForm.hazardVulnerability,
        medicalNotes: suForm.medicalNotes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'citizen',
      });

      setSuccess('Account created! Redirecting to your dashboard\u2026');
      // Auth state observer in App.tsx will redirect
    } catch (err) {
      setError(parseAuthError(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const hazardOptions: { value: HazardVulnerability; label: string; emoji: string }[] = [
    { value: 'flood',      label: 'Flood-prone zone',  emoji: '\uD83C\uDF0A' },
    { value: 'earthquake', label: 'Earthquake zone',   emoji: '\uD83C\uDFDA\uFE0F' },
    { value: 'wildfire',   label: 'Wildfire area',     emoji: '\uD83D\uDD25' },
    { value: 'none',       label: 'None / Not sure',   emoji: '\u2705' },
  ];

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
          <div className="auth-logo">
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">TerraGuard</h1>
          <p className="auth-subtitle">Civilian Disaster Companion</p>
        </div>

        {/* Mode Toggle */}
        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button
            role="tab"
            aria-selected={mode === 'signin'}
            id="tab-signin"
            className={`auth-toggle__btn ${mode === 'signin' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => switchMode('signin')}
            disabled={loading}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={mode === 'signup'}
            id="tab-signup"
            className={`auth-toggle__btn ${mode === 'signup' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => switchMode('signup')}
            disabled={loading}
          >
            Create Account
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
              label="Email address"
              type="email"
              value={siForm.email}
              onChange={v => setSiForm(f => ({ ...f, email: v }))}
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              required
              disabled={loading}
              autoComplete="email"
            />

            <div className="auth-field">
              <label htmlFor="si-password" className="auth-field__label">
                Password<span className="auth-field__required" aria-hidden>*</span>
              </label>
              <div className="auth-field__wrap">
                <span className="auth-field__icon" aria-hidden><Lock size={16} /></span>
                <input
                  id="si-password"
                  type={showPassword ? 'text' : 'password'}
                  value={siForm.password}
                  onChange={e => setSiForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  required
                  disabled={loading}
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
            </div>

            <button
              id="btn-signin"
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={18} className="auth-submit__spinner" /> Signing in&hellip;</>
                : <><span>Sign In</span><ArrowRight size={18} /></>
              }
            </button>

            <div className="auth-divider">
              <span>or instant emergency access</span>
            </div>

            <button
              id="btn-guest-login"
              type="button"
              className="auth-guest-btn"
              onClick={loginAsGuest}
              disabled={loading}
            >
              <UserCheck size={18} color="var(--brand-primary)" />
              <span>Login as a Guest</span>
            </button>

            <p className="auth-footer-note">
              Don&apos;t have an account?{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                Create one &rarr;
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
              Account Details
            </div>

            <InputField
              id="su-fullname"
              label="Full Name"
              value={suForm.fullName}
              onChange={v => setSuForm(f => ({ ...f, fullName: v }))}
              placeholder="Alex Razak"
              icon={<User size={16} />}
              required
              disabled={loading}
              autoComplete="name"
            />

            <InputField
              id="su-email"
              label="Email Address"
              type="email"
              value={suForm.email}
              onChange={v => setSuForm(f => ({ ...f, email: v }))}
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              required
              disabled={loading}
              autoComplete="email"
            />

            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="su-password" className="auth-field__label">
                  Password<span className="auth-field__required" aria-hidden>*</span>
                </label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon" aria-hidden><Lock size={16} /></span>
                  <input
                    id="su-password"
                    type={showPassword ? 'text' : 'password'}
                    value={suForm.password}
                    onChange={e => setSuForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    required
                    disabled={loading}
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
                  Confirm Password<span className="auth-field__required" aria-hidden>*</span>
                </label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon" aria-hidden><Lock size={16} /></span>
                  <input
                    id="su-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={suForm.confirmPassword}
                    onChange={e => setSuForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter password"
                    required
                    disabled={loading}
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
              Emergency Profile
            </div>

            <InputField
              id="su-phone"
              label="Phone Number"
              type="tel"
              value={suForm.phoneNumber}
              onChange={v => setSuForm(f => ({ ...f, phoneNumber: v }))}
              placeholder="+60 12-345 6789"
              icon={<Phone size={16} />}
              required
              disabled={loading}
              autoComplete="tel"
            />

            <InputField
              id="su-address"
              label="Home Address / Location"
              value={suForm.homeAddress}
              onChange={v => setSuForm(f => ({ ...f, homeAddress: v }))}
              placeholder="No. 12, Jalan Contoh, 50000 KL"
              icon={<MapPin size={16} />}
              required
              disabled={loading}
              autoComplete="street-address"
            />

            {/* Hazard Vulnerability */}
            <div className="auth-field">
              <span id="su-hazard" className="auth-field__label">
                Primary Hazard Vulnerability
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
                      disabled={loading}
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
                Medical / Mobility Notes
                <span className="auth-field__optional">(Optional)</span>
              </label>
              <textarea
                id="su-medical"
                value={suForm.medicalNotes}
                onChange={e => setSuForm(f => ({ ...f, medicalNotes: e.target.value }))}
                placeholder="e.g. Wheelchair user, diabetic, requires insulin refrigeration&hellip;"
                disabled={loading}
                rows={3}
                className="auth-field__textarea"
              />
              <p className="auth-field__hint">
                This information is shared with rescue teams only during an emergency.
              </p>
            </div>

            <button
              id="btn-signup"
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={18} className="auth-submit__spinner" /> Creating account&hellip;</>
                : <><span>Create My Account</span><ArrowRight size={18} /></>
              }
            </button>

            <p className="auth-footer-note">
              Already have an account?{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                Sign in &rarr;
              </button>
            </p>
          </form>
        )}

        {/* Footer branding */}
        <p className="auth-brand-note">
          🛡️ Your data is protected and only used for disaster response coordination.
        </p>
      </div>
    </div>
  );
};

export default Auth;
