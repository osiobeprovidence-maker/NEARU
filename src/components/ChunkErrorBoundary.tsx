import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const RELOAD_KEY = 'rally_chunk_reload_v1';

export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const isChunkError =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Importing a module script failed');

    if (isChunkError && !sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
      return;
    }

    console.error('ChunkErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      sessionStorage.removeItem(RELOAD_KEY);
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
            <span className="text-indigo-600 font-black text-2xl">L</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">
            The page failed to load. This usually happens after an app update.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem(RELOAD_KEY);
              window.location.href = '/';
            }}
            className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all"
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
