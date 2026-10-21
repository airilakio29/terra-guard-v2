import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  /** Raw Firebase Auth user, null when signed out */
  firebaseUser: User | null;
  /** Extended Firestore profile, null when signed out or loading */
  userProfile: UserProfile | null;
  /** Whether the user is signed in as a guest */
  isGuest: boolean;
  /** True while the initial auth state is resolving */
  authLoading: boolean;
  /** True while the Firestore profile is being fetched */
  profileLoading: boolean;
  /** Sign the current user out */
  logout: () => Promise<void>;
  /** Login instantly as a guest without credentials */
  loginAsGuest: () => void;
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
            // Profile missing (e.g., created outside this flow) — provide minimal fallback
            setUserProfile({
              uid: user.uid,
              email: user.email,
              fullName: user.displayName ?? '',
              phoneNumber: '',
              homeAddress: '',
              hazardVulnerability: 'none',
              medicalNotes: '',
              role: 'citizen',
              createdAt: null,
              updatedAt: null,
            });
          }
        } catch (e) {
          console.error('[AuthContext] Failed to fetch user profile:', e);
          setUserProfile(null);
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

  const loginAsGuest = () => {
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

  const logout = async () => {
    setIsGuest(false);
    try {
      localStorage.removeItem('terra_guard_guest_session');
    } catch {
      // ignore
    }
    if (auth.currentUser) {
      await signOut(auth);
    }
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      isGuest,
      authLoading,
      profileLoading,
      logout,
      loginAsGuest,
    }}>
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
