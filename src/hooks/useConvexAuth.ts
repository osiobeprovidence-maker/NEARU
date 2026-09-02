/**
 * useConvexAuth — Firebase token bridge for ConvexProviderWithAuth.
 *
 * ConvexProviderWithAuth requires a hook that returns:
 *   { isLoading: boolean; isAuthenticated: boolean; fetchAccessToken: (opts) => Promise<string | null> }
 *
 * This hook:
 *   1. Subscribes to Firebase onAuthStateChanged to track loading / session.
 *   2. Returns fetchAccessToken which calls auth.currentUser.getIdToken().
 *      forceRefreshToken=true is passed through so Convex can force-refresh
 *      when a token is about to expire.
 *   3. Is entirely independent of AuthContext — it lives at the root level
 *      (inside ConvexProviderWithAuth, outside AuthProvider) so the token
 *      is available to Convex before AuthContext mounts.
 */
import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface ConvexAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchAccessToken: (args: { forceRefreshToken: boolean }) => Promise<string | null>;
}

export function useConvexAuth(): ConvexAuthState {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | undefined>(
    // undefined = still loading; null = signed out; FirebaseUser = signed in
    undefined
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user ?? null);
    });
    return unsub;
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }): Promise<string | null> => {
      // Always read currentUser directly rather than the captured state so we
      // never return a stale token after the user signs in.
      const user = auth.currentUser;
      if (!user) return null;
      try {
        return await user.getIdToken(forceRefreshToken);
      } catch {
        return null;
      }
    },
    []
  );

  return {
    isLoading: firebaseUser === undefined,
    isAuthenticated: firebaseUser !== null && firebaseUser !== undefined,
    fetchAccessToken,
  };
}
