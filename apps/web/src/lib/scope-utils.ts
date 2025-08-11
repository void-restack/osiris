/**
 * Utility functions for handling MCP scopes and their display names
 */

import { getScopeDisplayName as getLocalScopeDisplayName, getServiceScopeDefinitions, SCOPE_DEFINITIONS } from './scope-definitions';

export interface ScopeMapping {
    [scopeUrl: string]: string;
}

export interface ServiceClient {
    name: string;
    scopeDefinitions: ScopeMapping;
}

export interface AuthScopesData {
    serviceClientMap: {
        [serviceName: string]: string[];
    };
    serviceClients: ServiceClient[];
}

/**
 * Get human-readable scope names for a given service
 * @param serviceName - The name of the service (e.g., "google")
 * @param authScopes - The auth scopes data from the API
 * @returns Array of scopes with id and label
 */
export function getReadableScopes(
    serviceName: string,
    authScopes: AuthScopesData | undefined
): Array<{ id: string; label: string }> {
    if (!authScopes) return [];

    // Get the MCP-specific required scopes for this service
    const mcpRequiredScopes = authScopes.serviceClientMap?.[serviceName] || [];

    // Use local scope definitions for better performance and reliability
    const localScopeDefinitions = getServiceScopeDefinitions(serviceName);

    // Map scopes to their readable names using local definitions first, then API fallback
    return mcpRequiredScopes.map((scope) => {
        const scopeUrl = extractScopeUrl(scope);
        const localDisplayName = localScopeDefinitions[scopeUrl];

        // If we have a local definition, use it; otherwise fall back to API data
        const displayName = localDisplayName ||
            authScopes.serviceClients?.find(client => client.name === serviceName)?.scopeDefinitions?.[scopeUrl] ||
            scopeUrl;

        return {
            id: scope,
            label: displayName
        };
    });
}

/**
 * Get scope display name from local definitions or scopeDefinitions
 * @param scopeUrl - The full scope URL
 * @param scopeDefinitions - The scope definitions mapping (optional, for fallback)
 * @returns Human-readable scope name or the original URL if not found
 */
export function getScopeDisplayName(
    scopeUrl: string,
    scopeDefinitions?: ScopeMapping
): string {
    // Try local definitions first
    const localDisplayName = getLocalScopeDisplayName(scopeUrl);
    if (localDisplayName !== scopeUrl) {
        return localDisplayName;
    }

    // Fall back to provided scopeDefinitions if available
    if (scopeDefinitions) {
        return scopeDefinitions[scopeUrl] || scopeUrl;
    }

    return scopeUrl;
}

/**
 * Extract service name from a scope URL (e.g., "google:https://...")
 * @param scope - The scope string from serviceClientMap
 * @returns The service name
 */
export function extractServiceName(scope: string): string {
    const firstColonIndex = scope.indexOf(':');
    return firstColonIndex !== -1 ? scope.substring(0, firstColonIndex) : scope;
}

/**
 * Extract scope URL from a scope string (e.g., "google:https://...")
 * @param scope - The scope string from serviceClientMap
 * @returns The scope URL
 */
export function extractScopeUrl(scope: string): string {
    const firstColonIndex = scope.indexOf(':');
    return firstColonIndex !== -1 ? scope.substring(firstColonIndex + 1) : scope;
}

/**
 * Format a scope for display using local definitions
 * @param scope - The scope string (e.g., "google:https://www.googleapis.com/auth/calendar" or "https://www.googleapis.com/auth/calendar")
 * @param serviceName - Optional service name for scopes without service prefix
 * @returns Human-readable scope name
 */
export function formatScopeForDisplay(scope: string, serviceName?: string): string {
    // First try to get the display name using the full scope
    const fullScopeDisplay = getLocalScopeDisplayName(scope);
    if (fullScopeDisplay !== scope) {
        return fullScopeDisplay;
    }

    // If that didn't work, try to extract the service name and scope URL
    let extractedServiceName = serviceName;
    let scopeUrl = scope;

    const firstColonIndex = scope.indexOf(':');
    if (firstColonIndex !== -1) {
        // Scope has service prefix (e.g., "google:https://...")
        extractedServiceName = scope.substring(0, firstColonIndex);
        scopeUrl = scope.substring(firstColonIndex + 1);
    }

    if (extractedServiceName && scopeUrl) {
        // Try to get the display name for the scope URL within the service
        const serviceDefinitions = getServiceScopeDefinitions(extractedServiceName);
        if (serviceDefinitions && serviceDefinitions[scopeUrl]) {
            return serviceDefinitions[scopeUrl];
        }
    }

    // If we still don't have a display name, try to find it across all services
    // This is useful for MCP servers where scopes are normalized (service prefix removed)
    if (!extractedServiceName || !serviceName) {
        for (const [service, definitions] of Object.entries(SCOPE_DEFINITIONS)) {
            if (definitions && typeof definitions === 'object' && scope in definitions) {
                return (definitions as Record<string, string>)[scope];
            }
        }
    }

    // If we still don't have a display name, try to clean up the URL for display
    if (scopeUrl && scopeUrl.startsWith('http')) {
        const urlParts = scopeUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart !== 'auth') {
            return lastPart.replace(/\./g, ' ').replace(/_/g, ' ').replace(/-/g, ' ');
        }
        const secondLastPart = urlParts[urlParts.length - 2];
        if (secondLastPart && secondLastPart !== 'googleapis.com') {
            return secondLastPart.replace(/\./g, ' ').replace(/_/g, ' ').replace(/-/g, ' ');
        }
    }

    // Final fallback: clean up the scope for display
    const finalScope = scopeUrl || scope;
    return finalScope.replace('https://', '').replace('http://', '').replace('www.', '');
}
