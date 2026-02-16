import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React runtime errors
 * Prevents entire app from crashing to blank screen
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        // Clear cache and reload
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-black/50 border border-red-500/30 rounded-lg p-6 text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h1 className="text-red-400 text-xl font-bold mb-2">
                            An Error Occurred
                        </h1>
                        <p className="text-gray-400 text-sm mb-4">
                            The application encountered an error. Please refresh the page.
                        </p>

                        {/* Error details - collapsed by default */}
                        <details className="text-left mb-4">
                            <summary className="text-[#00ff41] text-xs cursor-pointer hover:underline">
                                Error Details (for developers)
                            </summary>
                            <div className="mt-2 p-3 bg-black/50 rounded text-xs font-mono text-red-300 overflow-auto max-h-40">
                                <div className="font-bold text-red-400 mb-1">
                                    {this.state.error?.name}: {this.state.error?.message}
                                </div>
                                <pre className="text-gray-500 whitespace-pre-wrap">
                                    {this.state.error?.stack}
                                </pre>
                                {this.state.errorInfo && (
                                    <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                                        Component Stack:
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        </details>

                        <button
                            onClick={this.handleReload}
                            className="px-6 py-2 bg-[#00ff41] text-black font-bold rounded-lg hover:bg-[#00cc33] transition-colors"
                        >
                            🔄 Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
