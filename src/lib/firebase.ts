import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTUPKW0oVzuTFKrCjzDto_dtqXL7ijeEI",
  authDomain: "usenearu.firebaseapp.com",
  projectId: "usenearu",
  storageBucket: "usenearu.firebasestorage.app",
  messagingSenderId: "415405275981",
  appId: "1:415405275981:web:2ed53d7318cb345f029504",
  measurementId: "G-NCZZ1WFE1Z",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with multi-tier browser persistence (IndexedDB -> LocalStorage -> SessionStorage)
// and browserPopupRedirectResolver for rock-solid OAuth popup/redirect handling.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
    ],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  // If already initialized (e.g. Vite fast refresh), obtain the existing instance
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Google provider — configured once here, imported wherever needed.
export const googleProvider = new GoogleAuthProvider();
// Request basic profile + email on every sign-in. Additional scopes can be
// added here later without touching the UI (e.g. drive, calendar).
googleProvider.addScope("profile");
googleProvider.addScope("email");
// Force the account-chooser to always appear so multi-account users can
// switch identities cleanly.
googleProvider.setCustomParameters({ prompt: "select_account" });

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
};
