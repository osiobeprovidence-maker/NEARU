import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ConvexProvider, ConvexReactClient} from 'convex/react';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { BrandProvider } from './contexts/BrandContext.tsx';

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL ?? 'https://rare-rooster-878.eu-west-1.convex.cloud'
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrandProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrandProvider>
    </ConvexProvider>
  </StrictMode>,
);
