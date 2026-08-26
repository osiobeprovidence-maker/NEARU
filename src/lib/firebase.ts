import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

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

export function setupRecaptcha(elementId: string): RecaptchaVerifier {
  const key = `recaptchaVerifier_${elementId}`;
  const win = window as unknown as Record<string, unknown>;

  // Clear stale verifier so Firebase re-renders it fresh
  if (win[key]) {
    try {
      (win[key] as RecaptchaVerifier).clear();
    } catch {
      // ignore cleanup errors
    }
    delete win[key];
  }

  win[key] = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
  });

  return win[key] as RecaptchaVerifier;
}
