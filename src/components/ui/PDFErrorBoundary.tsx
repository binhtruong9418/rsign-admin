import React, { Component } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary specifically for PDF rendering errors
 * Prevents PDF worker crashes from breaking the entire app
 */
export class PDFErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('PDF Error Boundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="text-center max-w-md">
                        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                            PDF Rendering Error
                        </h2>
                        <p className="text-sm text-secondary-600 mb-4">
                            {this.state.error?.message || 'Failed to render PDF document'}
                        </p>
                        <p className="text-xs text-secondary-500 mb-6">
                            This might be due to a corrupted file or browser compatibility issue.
                        </p>
                        <Button onClick={this.handleReset} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
