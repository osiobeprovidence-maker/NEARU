import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
};
