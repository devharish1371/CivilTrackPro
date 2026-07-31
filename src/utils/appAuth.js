import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, FIREBASE_AUTH_EMAIL } from './firebase';

/** Verify the 6-digit master password against Firebase Auth (no password stored in app code). */
export async function verifyMasterPassword(password) {
  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error('Sign in required'), { code: 'auth/not-signed-in' });
  }
  const credential = EmailAuthProvider.credential(FIREBASE_AUTH_EMAIL, password);
  await reauthenticateWithCredential(user, credential);
}

export function formatMasterPasswordError(error) {
  if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
    return 'Incorrect password';
  }
  if (error?.code === 'auth/not-signed-in') {
    return 'Unlock the app first, then try again';
  }
  if (error?.code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a moment and try again.';
  }
  return error?.message || 'Password verification failed';
}
