import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

/**
 * Error boundary specifically wrapping AuthProvider.
 *
 * Convex's useQuery throws a server error into the React render cycle when
 * the backend returns an error response. Without a boundary this propagates
 * all the way up to ChunkErrorBoundary and blanks the entire app.
 *
 * This boundary catches those errors and auto-retries up to 3 times with a
 * short delay, showing the LALAO loading spinner while retrying. After 3
 * failures it shows a minimal "something went wrong" screen with a reload
 * button — it never shows a blank page.
 */
export default class AuthErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AuthErrorBoundary] Caught error:', error?.message || error);
    console.error('[AuthErrorBoundary] Component stack:', info.componentStack);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (prevState.hasError === false && this.state.hasError) {
      if (this.state.retryCount < 3) {
        // Auto-retry after a short back-off (1s, 2s, 3s)
        const delay = (this.state.retryCount + 1) * 1000;
        this.retryTimer = setTimeout(() => {
          this.setState(s => ({ hasError: false, retryCount: s.retryCount + 1 }));
        }, delay);
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.retryCount < 3) {
        // Retrying — show the same loading spinner the app normally shows
        return (
          <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-pulse">
              <span className="text-white font-black text-lg tracking-tighter">L</span>
            </div>
          </div>
        );
      }

      // Exhausted retries — show a recoverable error screen
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-zinc-400 font-black text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
            We had trouble connecting to lalao. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
