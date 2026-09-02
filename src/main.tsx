import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { BrandProvider } from './contexts/BrandContext.tsx';
import { useConvexAuth } from './hooks/useConvexAuth.ts';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL. Set it to the Convex deployment URL for this environment.');
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      ConvexProviderWithAuth replaces the plain ConvexProvider.
      It calls useConvexAuth() to obtain the Firebase ID token and injects it
      into every Convex request so that ctx.auth.getUserIdentity() works
      server-side. The token is refreshed automatically when it nears expiry.
    */}
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      <BrandProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrandProvider>
    </ConvexProviderWithAuth>
  </StrictMode>,
);
