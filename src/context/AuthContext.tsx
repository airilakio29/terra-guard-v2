import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// ─── User Profile (matches Firestore `users/{uid}` document) ─────────────────

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName: string;
  phoneNumber: string;
  homeAddress: string;
  hazardVulnerability: 'flood' | 'earthquake' | 'wildfire' | 'none';
  medicalNotes: string;
  role: 'citizen' | 'responder' | 'admin';
  avatarUrl?: string;
  themeId?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface AuthContextType {
  /** Active Firebase user or null */
  user: User | null;
  /** Backwards compatibility alias */
  firebaseUser: User | null;
  /** Extended Firestore profile, null when signed out or loading */
  userProfile: UserProfile | null;
  /** Whether the user is signed in as an emergency guest */
  isGuest: boolean;
  /** Backwards compatibility alias */
  guest: boolean;
  /** True while the initial auth state is resolving */
  loading: boolean;
  /** Backwards compatibility alias */
  authLoading: boolean;
  /** True while the Firestore profile is being fetched */
  profileLoading: boolean;

  /** Sign in with email and password */
  signInWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  /** Register a new user and create their Firestore profile */
  signUpWithEmail: (
    email: string,
    pass: string,
    profileData?: Partial<UserProfile>
  ) => Promise<UserCredential>;
  /** Sign in with Google provider popup (with redirect fallback for PWA & blocked popups) */
  signInWithGoogle: () => Promise<UserCredential | void>;
  /** Send password reset link to user's email */
  resetPassword: (email: string) => Promise<void>;
  /** Login instantly as guest without credentials */
  continueAsGuest: () => void;
  /** Backwards compatibility alias */
  loginAsGuest: () => void;
  /** Sign out active user or guest session */
  signOut: () => Promise<void>;
  /** Backwards compatibility alias */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem('terra_guard_guest_session') === 'true';
    } catch {
      return false;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  /**
   * Syncs the user's Firestore profile document.
   * Creates initial record for first-time Google sign-ins, or non-destructively
   * merges missing fields (photoURL, displayName) without overwriting existing data.
   */
  const syncUserProfile = async (user: User): Promise<UserProfile> => {
    setProfileLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const savedTheme = localStorage.getItem('terra_guard_theme') || 'terra-classic';

      if (snap.exists()) {
        const existingData = snap.data() as UserProfile;
        const updates: Record<string, unknown> = {};

        // Non-destructively merge missing attributes
        if (!existingData.fullName && user.displayName) {
          updates.fullName = user.displayName;
        }
        if (!existingData.avatarUrl && user.photoURL) {
          updates.avatarUrl = user.photoURL;
        }
        if (!existingData.email && user.email) {
          updates.email = user.email;
        }

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = serverTimestamp();
          try {
            await setDoc(userRef, updates, { merge: true });
          } catch (updateErr) {
            console.warn('[AuthContext] Could not merge user doc updates:', updateErr);
          }
        }

        const merged: UserProfile = {
          ...existingData,
          ...updates,
        };

        // Cache Google avatar if none was previously cached
        if (merged.avatarUrl && !localStorage.getItem(`terra_guard_user_avatar_${user.uid}`)) {
          localStorage.setItem(`terra_guard_user_avatar_${user.uid}`, merged.avatarUrl);
        }

        setUserProfile(merged);
        return merged;
      } else {
        // First-time user profile creation
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || 'Civilian',
          phoneNumber: user.phoneNumber || '',
          homeAddress: '',
          hazardVulnerability: 'none',
          medicalNotes: '',
          role: 'citizen',
          avatarUrl: user.photoURL || undefined,
          themeId: savedTheme,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        try {
          await setDoc(userRef, newProfile);
        } catch (saveErr) {
          console.warn('[AuthContext] Could not auto-create missing user doc:', saveErr);
        }

        if (user.photoURL) {
          try {
            localStorage.setItem(`terra_guard_user_avatar_${user.uid}`, user.photoURL);
          } catch {}
        }

        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (e) {
      console.error('[AuthContext] Failed to fetch/sync user profile:', e);
      const fallback: UserProfile = {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || 'Civilian',
        phoneNumber: '',
        homeAddress: '',
        hazardVulnerability: 'none',
        medicalNotes: '',
        role: 'citizen',
        avatarUrl: user.photoURL || undefined,
        createdAt: null,
        updatedAt: null,
      };
      setUserProfile(fallback);
      return fallback;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // First handle redirect result (for iOS standalone PWA & redirect fallback)
    // so returning users land immediately in the main UI without login screen flash
    const initAuthFlow = async () => {
      try {
        const redirectCred = await getRedirectResult(auth);
        if (isMounted && redirectCred?.user) {
          setIsGuest(false);
          try {
            localStorage.removeItem('terra_guard_guest_session');
          } catch {}
          await syncUserProfile(redirectCred.user);
        }
      } catch (redirectErr) {
        console.warn('[AuthContext] getRedirectResult check:', redirectErr);
      }

      // Listen to subsequent auth state transitions
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        setFirebaseUser(user);

        if (user) {
          setIsGuest(false);
          try {
            localStorage.removeItem('terra_guard_guest_session');
          } catch {}
          await syncUserProfile(user);
        } else {
          if (!isGuest) {
            setUserProfile(null);
          }
        }

        setAuthLoading(false);
      });

      return unsubscribe;
    };

    let unsubFn: (() => void) | undefined;
    initAuthFlow().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubFn) {
        unsubFn();
      }
    };
  }, [isGuest]);

  const signInWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    setIsGuest(false);
    return cred;
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    profileData?: Partial<UserProfile>
  ): Promise<UserCredential> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;

    const newProfile: Partial<UserProfile> = {
      uid: user.uid,
      email: user.email,
      fullName: profileData?.fullName?.trim() || user.displayName || 'Civilian',
      phoneNumber: profileData?.phoneNumber?.trim() || '',
      homeAddress: profileData?.homeAddress?.trim() || '',
      hazardVulnerability: profileData?.hazardVulnerability || 'none',
      medicalNotes: profileData?.medicalNotes?.trim() || '',
      role: profileData?.role || 'citizen',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile(newProfile as UserProfile);
    } catch (err) {
      console.error('[AuthContext] Error creating user profile document:', err);
    }

    setIsGuest(false);
    return cred;
  };

  const signInWithGoogle = async (): Promise<UserCredential | void> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // iOS standalone PWA detection: popups are blocked or open in detached sheets that lose auth context
    const isIosStandalone =
      typeof window !== 'undefined' &&
      ((window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        (window.matchMedia('(display-mode: standalone)').matches && /iphone|ipad|ipod/i.test(navigator.userAgent)));

    if (isIosStandalone) {
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      const cred = await signInWithPopup(auth, provider);
      setIsGuest(false);
      try {
        localStorage.removeItem('terra_guard_guest_session');
      } catch {}
      if (cred.user) {
        await syncUserProfile(cred.user);
      }
      return cred;
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      // Fallback automatically to redirect flow if popup was blocked
      if (authErr?.code === 'auth/popup-blocked') {
        console.info('[AuthContext] Popup blocked, auto-falling back to signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    try {
      localStorage.setItem('terra_guard_guest_session', 'true');
    } catch {}
    setUserProfile({
      uid: 'guest-' + Date.now(),
      email: 'guest@terraguard.local',
      fullName: 'Emergency Guest Civilian',
      phoneNumber: 'N/A',
      homeAddress: 'Local Area',
      hazardVulnerability: 'none',
      medicalNotes: '',
      role: 'citizen',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const signOut = async () => {
    setIsGuest(false);
    try {
      localStorage.removeItem('terra_guard_guest_session');
    } catch {}
    if (auth.currentUser) {
      await fbSignOut(auth);
    }
    setUserProfile(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        firebaseUser,
        userProfile,
        isGuest,
        guest: isGuest,
        loading: authLoading,
        authLoading,
        profileLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        continueAsGuest,
        loginAsGuest: continueAsGuest,
        signOut,
        logout: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export default AuthContext;
