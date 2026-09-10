import { initializeApp, getApps, getApp } from "firebase/app";
import { Capacitor } from "@capacitor/core";
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

import { firebaseConfig } from "../../auth/firebase_config.js";


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Platform‑specific Auth initialization.
let authInstance;
if (Capacitor.isNativePlatform()) {
  // On Android/iOS the native plugin handles sign‑in; default auth instance is sufficient.
  authInstance = getAuth(app);
} else {
  // On web use multi‑tier persistence for robust session handling.
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
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
