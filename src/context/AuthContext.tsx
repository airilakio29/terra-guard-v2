import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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
  /** Sign in with Google provider popup */
  signInWithGoogle: () => Promise<UserCredential>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        setIsGuest(false);
        try {
          localStorage.removeItem('terra_guard_guest_session');
        } catch {
          // ignore
        }

        // Fetch Firestore profile
        setProfileLoading(true);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // Profile missing (e.g. Google Sign-In first time or created externally)
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || 'Civilian',
              phoneNumber: user.phoneNumber || '',
              homeAddress: '',
              hazardVulnerability: 'none',
              medicalNotes: '',
              role: 'citizen',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            try {
              await setDoc(doc(db, 'users', user.uid), fallbackProfile);
            } catch (saveErr) {
              console.warn('[AuthContext] Could not auto-create missing user doc:', saveErr);
            }
            setUserProfile(fallbackProfile);
          }
        } catch (e) {
          console.error('[AuthContext] Failed to fetch user profile:', e);
          setUserProfile({
            uid: user.uid,
            email: user.email,
            fullName: user.displayName || 'Civilian',
            phoneNumber: '',
            homeAddress: '',
            hazardVulnerability: 'none',
            medicalNotes: '',
            role: 'citizen',
            createdAt: null,
            updatedAt: null,
          });
        } finally {
          setProfileLoading(false);
        }
      } else {
        if (!isGuest) {
          setUserProfile(null);
        }
      }

      setAuthLoading(false);
    });

    return unsubscribe;
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

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    setIsGuest(false);
    try {
      localStorage.removeItem('terra_guard_guest_session');
    } catch {
      // ignore
    }
    return cred;
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    try {
      localStorage.setItem('terra_guard_guest_session', 'true');
    } catch {
      // ignore
    }
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
    } catch {
      // ignore
    }
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
