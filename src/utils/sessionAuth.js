import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, FIREBASE_AUTH_EMAIL } from './firebase';

const SESSION_KEY = 'ct_session_unlocked';

export function isSessionUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function unlockSession() {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function clearSessionUnlock() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function lockSession() {
  clearSessionUnlock();
  try {
    await signOut(auth);
  } catch {
    // Ignore sign-out errors during lock.
  }
}

export async function signInWithAppPassword(password) {
  await signInWithEmailAndPassword(auth, FIREBASE_AUTH_EMAIL, password);
  unlockSession();
}
