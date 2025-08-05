import { isAuthenticated } from './auth';

/**
 * Enhanced auth check for TanStack Router beforeLoad
 * Returns auth state and handles redirects if needed
 */
export const checkAuth = () => {
    const authenticated = isAuthenticated();

    return {
        authenticated,
        timestamp: Date.now(), // For cache invalidation
    };
};

/**
 * Router context type extension for auth
 */
export type AuthRouterContext = {
    auth: {
        authenticated: boolean;
        timestamp: number;
    };
};

/**
 * Shared beforeLoad function for routes that need auth checking
 */
export const authBeforeLoad = () => {
    return checkAuth();
};

/**
 * Lightweight hook for components that need reactive auth state
 * Only used for components that need real-time auth updates
 */
export const useAuthState = () => {
    // This would be a simpler version without storage listeners
    // Only for components that specifically need reactivity
    return isAuthenticated();
};