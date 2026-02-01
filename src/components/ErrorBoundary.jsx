import React from 'react';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/'; // Hard reload to home as a safe recovery
    };

    handleGoBack = () => {
        window.history.back();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-600 mb-8">
                            We encountered an unexpected error. The application has been paused to prevent data loss.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-purple-200"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload Application
                            </button>

                            <button
                                onClick={this.handleGoBack}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                            >
                                Go Back
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-8 text-left">
                                <p className="text-xs font-mono text-red-500 bg-red-50 p-2 rounded overflow-auto max-h-32 border border-red-100">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
