/**
 * Server-side authentication helpers for Convex functions.
 *
 * Architecture:
 *   Firebase ID token (injected by ConvexProviderWithAuth)
 *     → Convex validates JWT against auth.config.ts
 *     → ctx.auth.getUserIdentity() returns verified claims
 *     → identity.subject = Firebase UID
 *     → getAuthenticatedUser() looks up the Convex user by firebaseUid
 *     → returns the full Convex user document
 *
 * All protected mutations import getAuthenticatedUser and call it at the
 * top of their handler. The returned user document is the only trusted
 * identity — client-supplied userId args are used only for targeting
 * OTHER users (e.g. who to follow, who to message) never for proving
 * who the caller IS.
 */

import { type MutationCtx, type QueryCtx } from "../_generated/server";

// ---------------------------------------------------------------------------
// Core auth helper
// ---------------------------------------------------------------------------

/**
 * Verify the caller is authenticated and return their Convex user document.
 *
 * Steps:
 *  1. Call ctx.auth.getUserIdentity() — returns null if no valid JWT present.
 *  2. Extract identity.subject (= Firebase UID) from the verified claims.
 *  3. Query the users table by the by_firebase_uid index.
 *  4. Return the full user document.
 *
 * Throws a descriptive ConvexError (surfaces as a Convex "server error") when:
 *  - No JWT / unauthenticated request
 *  - Firebase UID missing from claims
 *  - No Convex user record exists for this Firebase UID
 *
 * NOTE: every throw here is intentional — callers should not silently continue
 * if the identity cannot be established.
 */
export async function getAuthenticatedUser(ctx: MutationCtx | QueryCtx) {
  let identity;
  try {
    identity = await ctx.auth.getUserIdentity();
  } catch (err: any) {
    console.error("[auth] Failed to retrieve user identity from JWT:", err);
    throw new Error("Authentication failure: could not verify identity credentials.");
  }

  if (!identity) {
    console.warn("[auth] No authenticated Firebase identity found on request (JWT missing or expired).");
    throw new Error("Unauthenticated: you must be signed in to perform this action.");
  }

  const firebaseUid = identity.subject;
  if (!firebaseUid) {
    console.warn("[auth] Firebase identity token missing subject (UID) claim.");
    throw new Error("Authentication error: Firebase UID missing from identity token.");
  }

  let user;
  try {
    user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", firebaseUid))
      .first();
  } catch (dbErr: any) {
    console.error("[auth] Database error querying users table by_firebase_uid:", dbErr);
    throw new Error("Database error: failed to query user profile.");
  }

  if (!user) {
    console.warn(
      `[auth] Firebase user authenticated (UID: ${firebaseUid.slice(0, 8)}...) but no Convex user record exists yet.`
    );
    throw new Error(
      "Profile not found: your Firebase account is authenticated but no lalao profile exists yet. " +
      "Please complete onboarding."
    );
  }

  return user;
}

// ---------------------------------------------------------------------------
// Optional variant — returns null instead of throwing when no profile exists.
// Use this for mutations that should auto-provision the user (e.g. onboarding).
// ---------------------------------------------------------------------------

/**
 * Like getAuthenticatedUser but returns null (instead of throwing) when the
 * Convex user record doesn't exist yet. Still throws for unauthenticated
 * requests (no valid JWT).
 */
export async function getAuthenticatedUserOrNull(ctx: MutationCtx | QueryCtx) {
  let identity;
  try {
    identity = await ctx.auth.getUserIdentity();
  } catch (err: any) {
    console.error("[auth] Failed to retrieve user identity in getAuthenticatedUserOrNull:", err);
    throw new Error("Authentication failure: could not verify identity credentials.");
  }

  if (!identity) {
    console.warn("[auth] No authenticated Firebase identity in getAuthenticatedUserOrNull.");
    throw new Error("Unauthenticated: you must be signed in to perform this action.");
  }

  const firebaseUid = identity.subject;
  if (!firebaseUid) {
    console.warn("[auth] Firebase identity token missing subject claim in getAuthenticatedUserOrNull.");
    throw new Error("Authentication error: Firebase UID missing from identity token.");
  }

  try {
    return (
      (await ctx.db
        .query("users")
        .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", firebaseUid))
        .first()) ?? null
    );
  } catch (dbErr: any) {
    console.error("[auth] Database error in getAuthenticatedUserOrNull:", dbErr);
    throw new Error("Database error: failed to query user profile.");
  }
}

/**
 * Canonical export alias for optional authenticated user resolution.
 */
export const getOptionalAuthenticatedUser = getAuthenticatedUserOrNull;

// ---------------------------------------------------------------------------
// Admin guard — wraps getAuthenticatedUser and enforces admin role
// ---------------------------------------------------------------------------

const SUPER_ADMIN_EMAIL = "osiobeprovidence@gmail.com";

/**
 * Verify the caller is an authenticated admin.
 * Used by any Convex function that should only be callable by admin users
 * directly from the browser (as opposed to the serverless layer which uses
 * serverSecret + requestingAdminId).
 *
 * Returns the admin user document on success, throws otherwise.
 */
export async function getAuthenticatedAdmin(ctx: MutationCtx | QueryCtx) {
  const user = await getAuthenticatedUser(ctx);
  const isAdmin =
    user.email === SUPER_ADMIN_EMAIL ||
    user.role === "super_admin" ||
    user.role === "admin";
  if (!isAdmin) {
    throw new Error("Forbidden: admin access required.");
  }
  return user;
}
