import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || "AIzaSyCIntPbjZ3THxK2jR4Ad2wiXLX83SUGOP0",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || "terra-guard-bb09c.firebaseapp.com",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || "terra-guard-bb09c",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || "terra-guard-bb09c.firebasestorage.app",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || "84662326960",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || "1:84662326960:web:e169f47f209f6d676c0d75",
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) || "G-6QX49GVDK7",
};

// Initialize Firebase (guard against duplicate initialization during HMR)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase core services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const rtdb: Database = getDatabase(app);

export { firebaseConfig };
export default app;
