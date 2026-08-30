import { type QueryCtx, type MutationCtx } from "./_generated/server";

// Shared admin helpers (not registered Convex functions; same pattern as
// messagingHelpers.ts).
//
// SECURITY MODEL:
// Admin data functions in convex/admin.ts accept a `serverSecret` argument
// that only the serverless backend can supply (browsers never hold it), plus
// a `requestingAdminId` that must resolve to an actual admin role. Both gates
// must pass before any admin function runs.

const SUPER_ADMIN_EMAIL = "riderezzy@gmail.com";

/** True when the user document is the super admin or has an admin role. */
export function isAdminUser(user: any): boolean {
  if (!user) return false;
  if (user.email === SUPER_ADMIN_EMAIL) return true;
  return user.role === "super_admin" || user.role === "admin";
}

/** Resolve a user id to its document, or null when missing/invalid. */
export async function getUser(ctx: QueryCtx | MutationCtx, userId: any): Promise<any> {
  if (!userId) return null;
  try {
    return await ctx.db.get(userId);
  } catch {
    return null;
  }
}

/**
 * Throw unless `userId` resolves to a real admin. Returns the admin user doc.
 * Used as defense-in-depth on top of the server secret check.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: any
): Promise<any> {
  const user = await getUser(ctx, userId);
  if (!isAdminUser(user)) {
    throw new Error("Admin access required.");
  }
  return user;
}

/**
 * Strip fields that must never reach a browser from a user document.
 * Auth secrets are only ever handled by the serverless layer.
 */
export function redactUser(user: any) {
  if (!user) return user;
  const { passwordHash, totpSecret, ...safe } = user;
  void passwordHash;
  void totpSecret;
  return safe;
}