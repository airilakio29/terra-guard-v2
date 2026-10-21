import { storage, db } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

export type StorageMethod = 'firebase_storage' | 'firestore_data_url' | 'local_storage';

export interface SaveAvatarResult {
  url: string;
  method: StorageMethod;
  notes?: string;
}

/**
 * Save user avatar according to auth tier and infrastructure capability:
 * - Guest: saved in localStorage only.
 * - Signed In: Attempt Firebase Storage upload. If Storage is unavailable or restricted,
 *   fall back to saving the compressed 256x256 WebP/JPEG data URL directly into Firestore.
 * - Offline fallback: always mirrors to localStorage.
 */
export async function saveUserAvatar(
  userId: string | null | undefined,
  isGuest: boolean,
  avatarValue: string // Either 'preset:id' or 'data:image/...;base64,...'
): Promise<SaveAvatarResult> {
  // 1. Guest session: store in localStorage only
  if (isGuest || !userId || userId.startsWith('guest-')) {
    try {
      localStorage.setItem('terra_guard_guest_avatar', avatarValue);
    } catch (e) {
      console.warn('[AvatarStorage] localStorage error:', e);
    }
    return {
      url: avatarValue,
      method: 'local_storage',
      notes: 'Stored in local browser storage for guest session.',
    };
  }

  // 2. Preset Avatar (e.g. 'preset:fox'): No binary storage needed, store ID directly in Firestore
  if (avatarValue.startsWith('preset:')) {
    try {
      await setDoc(doc(db, 'users', userId), { avatarUrl: avatarValue, updatedAt: new Date() }, { merge: true });
      localStorage.setItem(`terra_guard_user_avatar_${userId}`, avatarValue);
      return {
        url: avatarValue,
        method: 'firestore_data_url',
        notes: 'Preset ID saved to Firestore user document.',
      };
    } catch (firestoreErr) {
      console.warn('[AvatarStorage] Firestore offline, saving preset to localStorage fallback:', firestoreErr);
      localStorage.setItem(`terra_guard_user_avatar_${userId}`, avatarValue);
      return {
        url: avatarValue,
        method: 'local_storage',
        notes: 'Saved to localStorage fallback (offline).',
      };
    }
  }

  // 3. Custom Image Upload: Attempt Firebase Storage first
  try {
    const timestamp = Date.now();
    const avatarRef = ref(storage, `users/${userId}/avatars/avatar_${timestamp}.webp`);
    await uploadString(avatarRef, avatarValue, 'data_url');
    const downloadUrl = await getDownloadURL(avatarRef);

    // Save download URL to Firestore user document
    await setDoc(doc(db, 'users', userId), { avatarUrl: downloadUrl, updatedAt: new Date() }, { merge: true });
    localStorage.setItem(`terra_guard_user_avatar_${userId}`, downloadUrl);

    return {
      url: downloadUrl,
      method: 'firebase_storage',
      notes: 'Uploaded to Firebase Storage bucket and linked to Firestore document.',
    };
  } catch (storageErr) {
    console.warn(
      '[AvatarStorage] Firebase Storage bucket unavailable or permission-denied. Storing compressed 256x256 image data URL directly in Firestore document:',
      storageErr
    );

    // Fall back to storing compressed 256x256 Data URL directly in Firestore user document
    try {
      await setDoc(doc(db, 'users', userId), { avatarUrl: avatarValue, updatedAt: new Date() }, { merge: true });
      localStorage.setItem(`terra_guard_user_avatar_${userId}`, avatarValue);

      return {
        url: avatarValue,
        method: 'firestore_data_url',
        notes: 'Stored compressed 256x256 data URL directly in Firestore user profile.',
      };
    } catch (firestoreErr) {
      console.warn('[AvatarStorage] Firestore write failed or offline. Storing in localStorage fallback:', firestoreErr);
      localStorage.setItem(`terra_guard_user_avatar_${userId}`, avatarValue);

      return {
        url: avatarValue,
        method: 'local_storage',
        notes: 'Saved to localStorage fallback (offline).',
      };
    }
  }
}

/**
 * Retrieve cached avatar from localStorage for instant display before network resolves
 */
export function getCachedAvatar(userId: string | null | undefined, isGuest: boolean): string | null {
  try {
    if (isGuest || !userId || userId.startsWith('guest-')) {
      return localStorage.getItem('terra_guard_guest_avatar');
    }
    return localStorage.getItem(`terra_guard_user_avatar_${userId}`);
  } catch {
    return null;
  }
}
