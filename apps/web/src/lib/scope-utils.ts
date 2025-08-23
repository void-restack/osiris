import { getScopeDisplayName } from './scope-definitions';

export type Permission = {
    id: string;
    label: string;
};

const SERVICES_PRESERVE_FULL_SCOPE = ['notion'];

/**
 * Extract the scope URL from a service-prefixed scope string
 * @param scope - The scope string (e.g., "google:https://www.googleapis.com/auth/calendar")
 * @returns Just the scope URL (e.g., "https://www.googleapis.com/auth/calendar")
 */
export function extractScopeUrl(scope: string): string {
    const firstColonIndex = scope.indexOf(':');
    if (firstColonIndex === -1) {
        return scope; // Return original if no colon found
    }

    const serviceName = scope.substring(0, firstColonIndex);

    if (SERVICES_PRESERVE_FULL_SCOPE.includes(serviceName)) {
        return scope;
    }

    return scope.substring(firstColonIndex + 1);
}

/**
 * Get package required scopes and transform them to Permission objects
 * @param authScopesData - The response from /packages/{packageId}/auth-scopes
 * @returns Array of Permission objects with scope URL as id
 */
export function getPackageRequiredScopes(authScopesData: any): Permission[] {
    if (!authScopesData?.serviceClientMap) {
        return [];
    }

    const permissions: Permission[] = [];

    // Iterate through each service in the serviceClientMap
    Object.entries(authScopesData.serviceClientMap).forEach(([serviceName, scopes]) => {
        if (Array.isArray(scopes)) {
            scopes.forEach((scope: string) => {
                const scopeUrl = extractScopeUrl(scope);
                permissions.push({
                    id: scopeUrl,                                    // "https://www.googleapis.com/auth/calendar"
                    label: getScopeDisplayName(scope)                 // "Access Calendar (Read, Write, Delete)"
                });
            });
        }
    });

    return permissions;
}

/**
 * Get currently selected scopes for a deployment from userServiceConnectionMcpDeployments
 * @param deployment - The deployment object from the API response
 * @returns Array of currently selected scopes (just the scope URLs)
 */
export function getDeploymentCurrentScopes(deployment: any): string[] {
    if (!deployment?.userServiceConnectionMcpDeployments) {
        return [];
    }

    // Get all scopes from all connections for this deployment
    const allScopes: string[] = [];
    deployment.userServiceConnectionMcpDeployments.forEach((connection: any) => {
        if (Array.isArray(connection.scopes)) {
            allScopes.push(...connection.scopes);
        }
    });

    return [...new Set(allScopes)]; // Remove duplicates
}

/**
 * Transform current deployment scopes to Permission objects
 * @param deployment - The deployment object
 * @returns Array of Permission objects for currently selected scopes
 */
export function getCurrentScopesAsPermissions(deployment: any): Permission[] {
    const currentScopes = getDeploymentCurrentScopes(deployment);
    return currentScopes.map(scope => ({
        id: scope,                           // "https://www.googleapis.com/auth/calendar"
        label: getScopeDisplayName(scope)    // "Access Calendar (Read, Write, Delete)"
    }));
}

/**
 * Get readable scopes for a service from auth scopes data (for MCP deploy dialog)
 * @param serviceName - The name of the service (e.g., "google")
 * @param authScopes - The auth scopes data from the API
 * @returns Array of Permission objects with scope URL as id
 */
export function getReadableScopes(serviceName: string, authScopes: any): Permission[] {
    if (!authScopes?.serviceClientMap?.[serviceName]) {
        return [];
    }

    const scopes = authScopes.serviceClientMap[serviceName];
    return scopes.map((scope: string) => ({
        id: extractScopeUrl(scope),          // "https://www.googleapis.com/auth/calendar"
        label: getScopeDisplayName(scope)    // "Access Calendar (Read, Write, Delete)"
    }));
}
