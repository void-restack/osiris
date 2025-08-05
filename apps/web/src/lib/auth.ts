import { useState, useEffect } from 'react';

/**
 * Check if user is currently authenticated
 * @returns boolean indicating authentication status
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem("access_token");
    // For now, just check if token exists and is not empty
    // In the future, we could add JWT validation here
    return !!(token && token.trim() !== "");
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

/**
 * React hook for reactive authentication state
 * Automatically updates when localStorage changes (across tabs)
 * @returns current authentication status
 */
export const useAuth = (): boolean => {
    const [authenticated, setAuthenticated] = useState(isAuthenticated);

    useEffect(() => {
        // Update auth state when localStorage changes (across tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === 'refresh_token') {
                setAuthenticated(isAuthenticated());
            }
        };

        // Also check periodically in case token expires
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
 * Get authentication status with additional metadata
 */
export const getAuthStatus = () => {
    const authenticated = isAuthenticated();
    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;

    return {
        authenticated,
        hasToken: !!token,
        // Could add token expiry check here in the future
    };
};