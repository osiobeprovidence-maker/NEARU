// Server-side authentication for RALLY API routes.
// Verifies a Firebase ID token sent by the frontend and resolves the calling
// Convex user. No browser can impersonate another user because we verify the
// token signature against Firebase's public certs.

import admin from "firebase-admin";
import { callConvexQuery } from "./convexClient.js";
import { authError } from "./errors.js";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "osiobeprovidence@gmail.com";

let appInit = false;
function getFirebaseApp() {
  if (!appInit) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "usenearu";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    try {
      if (admin.apps.length === 0) {
        if (clientEmail && rawPrivateKey) {
          // Production / Vercel: initialize with an explicit service-account
          // credential so verifyIdToken() can validate tokens without needing
          // Application Default Credentials (which are unavailable on Vercel).
          // The private key is stored in Vercel with literal \n sequences;
          // replace them with real newlines before passing to the SDK.
          const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
          admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
          });
        } else {
          // Local dev fallback: relies on Application Default Credentials
          // (e.g. `gcloud auth application-default login`) or a local emulator.
          // This will NOT work on Vercel — set FIREBASE_CLIENT_EMAIL and
          // FIREBASE_PRIVATE_KEY in your Vercel environment variables.
          console.warn(
            "[auth] FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY not set. " +
            "Firebase Admin is initializing without explicit credentials. " +
            "Token verification will fail on Vercel."
          );
          admin.initializeApp({ projectId });
        }
      }
    } catch {
      // already initialized — safe to ignore
    }
    appInit = true;
  }
  return admin;
}

/**
 * Extract and verify the Firebase ID token from an Authorization header.
 * Returns the decoded token claims on success, or throws ApiError.
 */
export async function requireFirebaseUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    const err = new Error("Missing authentication token");
    err.statusCode = 401;
    err.code = "AUTHENTICATION_ERROR";
    throw err;
  }

  try {
    const app = getFirebaseApp();
    const decoded = await app.auth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    // Log the real reason server-side (credential misconfiguration, clock skew,
    // genuinely expired token, etc.) without exposing details to the browser.
    const code = err?.code || "";
    const msg = err?.message || "";
    console.error("[auth] verifyIdToken failed:", {
      code,
      message: msg,
      // Best-effort token diagnostics without leaking signatures: the token's
      // issuer/audience identify which Firebase project minted it vs the one
      // this server verifies against.
      projectId: process.env.FIREBASE_PROJECT_ID || "(unset)",
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      tokenPayload: (() => {
        try {
          // payload is the middle JWT segment (base64url) -> JSON
          const parts = token.split(".");
          if (parts.length !== 3) return "(malformed token)";
          const payload = JSON.parse(
            Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
          );
          return {
            iss: payload.iss,
            aud: payload.aud,
            project_id: payload.aud ? String(payload.aud).replace(/^[0-9]+$/, "<api-key-numeric>") : undefined,
            exp: payload.exp,
            auth_time: payload.auth_time,
            iat: payload.iat,
            uid: payload.user_id,
          };
        } catch {
          return "(could not decode token)";
        }
      })(),
    });
    const e = new Error("Invalid or expired authentication token");
    e.statusCode = 401;
    e.code = "AUTHENTICATION_ERROR";
    throw e;
  }
}

/**
 * Resolve the Convex user document from a Firebase claim.
 * The Convex user is looked up by email (matches AuthContext.getByEmail flow).
 * Returns the Convex user doc or null.
 */
export async function resolveConvexUser(firebaseClaims) {
  const email = firebaseClaims.email;
  if (!email) return null;
  try {
    const user = await callConvexQuery("users:getByEmail", { email });
    return user || null;
  } catch {
    // If email lookup fails, still allow the endpoint to continue by returning
    // a minimal identity keyed off the Firebase uid (some flows may not have a
    // Convex user yet).
    return null;
  }
}

/**
 * Require the caller to be the RALLY super admin. Throws 403 otherwise.
 * Returns the authenticated Convex user.
 */
export async function requireSuperAdmin(req) {
  const firebaseClaims = await requireFirebaseUser(req);
  const convexUser = await resolveConvexUser(firebaseClaims);
  if (
    !convexUser ||
    (convexUser.email !== SUPER_ADMIN_EMAIL &&
      convexUser.role !== "super_admin" &&
      convexUser.role !== "admin")
  ) {
    throw authError("Admin access required.");
  }
  return { firebaseClaims, convexUser };
}
