import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Shared Firebase Auth account — create in Console → Authentication → Users (6-digit app password)
export const FIREBASE_AUTH_EMAIL = "civiltrack@civildashboard-fb026.firebaseapp.com";

const firebaseConfig = {
  apiKey: "AIzaSyB1j9AGTjb38ytnY3SL4C13m6_zDl2ufkQ",
  authDomain: "civildashboard-fb026.firebaseapp.com",
  projectId: "civildashboard-fb026",
  storageBucket: "civildashboard-fb026.firebasestorage.app",
  messagingSenderId: "143084546319",
  appId: "1:143084546319:web:3fc211af85fb302d28b67a",
  measurementId: "G-WG1LJCZVP5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(() => {});

// Enable IndexedDB persistence at init time (required for offline writes to resolve locally)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.log("Firebase Analytics could not be initialized");
}

const storage = getStorage(app);

export { app, db, auth, analytics, storage };
