import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
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

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
};
