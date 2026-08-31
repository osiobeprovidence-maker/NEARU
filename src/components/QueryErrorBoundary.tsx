import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  message?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Local error boundary for a single page/section. Convex `useQuery` throws
 * during render when a query returns a server error; without a boundary that
 * propagates up to the app-level ChunkErrorBoundary and blanks the whole app.
 * This catches it locally and shows a contained "couldn't load" state instead,
 * so the rest of the app keeps working. The underlying error is still logged.
 */
export default class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('QueryErrorBoundary:', error?.message || error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
              <span className="text-zinc-400 font-black text-2xl">?</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              This section couldn't be loaded
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              {this.props.message ||
                'Something went wrong loading this content. Please try again in a moment.'}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
