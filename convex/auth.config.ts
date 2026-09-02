/**
 * Convex Firebase JWT Authentication Configuration
 *
 * Tells Convex how to validate Firebase ID tokens so that
 * ctx.auth.getUserIdentity() works inside every query and mutation.
 *
 * How it works:
 *   1. The browser calls auth.currentUser.getIdToken() to get a signed JWT
 *      from Firebase.
 *   2. ConvexProviderWithAuth injects that token into every Convex request.
 *   3. Convex validates the token against Firebase's public certs using the
 *      issuer + applicationID below.
 *   4. ctx.auth.getUserIdentity() returns the decoded claims, including
 *      `subject` which is the Firebase UID.
 *
 * Firebase JWT claim mapping (standard):
 *   identity.subject       → Firebase UID  (e.g. "abc123xyz")
 *   identity.email         → user's email (may be undefined for phone-only accounts)
 *   identity.issuer        → "https://securetoken.google.com/usenearu"
 *   identity.tokenIdentifier → "<issuer>|<subject>"
 *
 * The `applicationID` must exactly match the Firebase project ID.
 * The `domain` must exactly match the issuer (without trailing slash).
 *
 * DO NOT add a trailing slash to domain — Convex will reject the config.
 */
export default {
  providers: [
    {
      domain: "https://securetoken.google.com/usenearu",
      applicationID: "usenearu",
    },
  ],
};
