// Shared admin route helper. Resolves the authenticated super admin to the
// calling Convex user id and supplies the server secret that admin Convex
// functions require. Browsers never reach Convex admin functions directly.

import { requireSuperAdmin } from "./auth.js";
import { serverSecret } from "./config.js";

/** Returns { requestingAdminId, serverSecret } for admin Convex calls. */
export async function adminContext(req) {
  const { convexUser } = await requireSuperAdmin(req);
  return {
    requestingAdminId: convexUser._id,
    serverSecret: serverSecret(),
  };
}