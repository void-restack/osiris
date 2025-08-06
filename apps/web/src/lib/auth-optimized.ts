import { useState, useEffect } from 'react';

/**
 * Lightweight auth state check without effects
 * Use this for most cases where you just need current auth state
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem("access_token");
    return !!(token && token.trim() !== "");
};

/**
 * Reactive auth hook - USE SPARINGLY
 * Only for components that absolutely need real-time auth updates
 * (e.g., header user menu, auth-sensitive buttons)
 */
export const useReactiveAuth = (): boolean => {
    const [authenticated, setAuthenticated] = useState(isAuthenticated);

    useEffect(() => {
        // Minimal listeners - only for critical UI components
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === 'refresh_token') {
                setAuthenticated(isAuthenticated());
            }
        };

        const handleFocusChange = () => {
            setAuthenticated(isAuthenticated());
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocusChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocusChange);
        };
    }, []);

    return authenticated;
};

/**
 * Utility function to clear cookie
 */
const clearCookie = (name: string): void => {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    clearCookie("refresh_token");
};