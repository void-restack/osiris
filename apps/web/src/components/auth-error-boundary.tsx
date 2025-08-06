import React, { Component, ReactNode } from 'react';
import { LoginButton } from './login-button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Check if it's an auth-related error
        const isAuthError = error.message.includes('Unauthorized') ||
            error.message.includes('Authentication required') ||
            error.message.includes('401');

        return { hasError: isAuthError, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log auth errors
        if (this.state.hasError) {

        }
    }

    render() {
        if (this.state.hasError) {
            // Return custom fallback or default login button
            return this.props.fallback || <LoginButton />;
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useAuthErrorHandler() {
    return (error: unknown) => {
        if (error instanceof Error) {
            const isAuthError = error.message.includes('Unauthorized') ||
                error.message.includes('Authentication required') ||
                error.message.includes('401');

            if (isAuthError) {

                return true; // Handled
            }
        }
        return false; // Not handled
    };
}