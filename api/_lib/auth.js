// Server-side authentication for RALLY API routes.
// Verifies a Firebase ID token sent by the frontend and resolves the calling
// Convex user. No browser can impersonate another user because we verify the
// token signature against Firebase's public certs.

import admin from "firebase-admin";
import { callConvexQuery } from "./convexClient.js";
import { authError } from "./errors.js";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "riderEasy@gmail.com";

let appInit = false;
function getFirebaseApp() {
  if (!appInit) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "usenearu";
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({ projectId });
      }
    } catch {
      // already initialized
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
    // Invalid or expired token
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
  if (!convexUser || convexUser.email !== SUPER_ADMIN_EMAIL) {
    throw authError("Admin access required.");
  }
  return { firebaseClaims, convexUser };
}
