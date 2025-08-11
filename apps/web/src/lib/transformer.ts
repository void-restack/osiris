import type {
  UserServiceConnection,
  ServiceClient,
  OAuthConnection,
  DatabaseConnection,
  WalletConnection,
} from "@/types/auth";

export const transformBackendUserAuth = (
  backendData: any[],
): UserServiceConnection[] => {
  const transformedData = backendData.map((item) => {
    const connection = item.user_service_connections;
    const serviceClient = item.service_clients;

    // Normalize scopes by removing service prefix to match scopeDefinitions keys
    const normalizeScopes = (scopes: string[], serviceName: string): string[] => {
      return scopes.map(scope => {
        // Remove service prefix (e.g., "linear:read" -> "read", "github:repo" -> "repo")
        const prefix = `${serviceName}:`;
        if (scope.startsWith(prefix)) {
          return scope.substring(prefix.length);
        }
        return scope;
      });
    };

    const normalizedScopes = normalizeScopes(connection.scopes || [], serviceClient.name);

    const baseConnection = {
      id: connection.id,
      clientId: connection.clientId,
      userId: connection.userId,
      uniqueId: connection.uniqueId || connection.id,
      name: connection.name || serviceClient.name,
      scopes: normalizedScopes,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      serviceClient: transformBackendServiceClient(serviceClient),
    };

    switch (serviceClient.type) {
      case "oauth":
        return {
          ...baseConnection,
          type: "oauth",
          credentials: connection.credentials || {},
          metadata: connection.metadata || {},
        } as OAuthConnection;

      case "secret_sharing":
        return {
          ...baseConnection,
          type: "secret_sharing",
          credentials: connection.credentials || {},
          metadata: {
            host:
              extractHostFromCredentials(connection.credentials) ||
              connection.metadata?.host,
            status: connection.metadata?.status || "Idle",
            lastActivity: connection.metadata?.lastActivity || "Unknown",
            ...connection.metadata,
          },
        } as DatabaseConnection;

      case "embedded_wallet":
        return {
          ...baseConnection,
          type: "embedded_wallet",
          credentials: connection.credentials || {},
          metadata: {
            id: connection.metadata?.id || connection.uniqueId,
            walletAddress: extractWalletAddress(connection.metadata),
            ...connection.metadata,
          },
          policy: connection.policy,
        } as WalletConnection;

      default:
        return {
          ...baseConnection,
          type: "oauth",
          credentials: {},
          metadata: {},
        } as OAuthConnection;
    }
  });

  return transformedData;
};

export const transformBackendServiceClient = (
  backendData: any,
): ServiceClient => {
  return {
    clientId: backendData.clientId,
    name: backendData.name,
    description: backendData.description || "",
    type: backendData.type,
    supportedScopes: backendData.supportedScopes || [],
    scopeDefinitions: backendData.scopeDefinitions || {},
    supportedServices: backendData.supportedServices || [],
    metadata: backendData.metadata || {},
    iconUrl: backendData.iconUrl,
    createdAt: backendData.createdAt,
    updatedAt: backendData.updatedAt,
  };
};

export const transformBackendConnection = (
  backendData: any,
  serviceClient?: any,
): UserServiceConnection => {
  const baseConnection = {
    id: backendData.id,
    clientId: backendData.clientId,
    userId: backendData.userId,
    uniqueId: backendData.uniqueId || backendData.id,
    name: backendData.name,
    scopes: backendData.scopes || [],
    createdAt: backendData.createdAt,
    updatedAt: backendData.updatedAt,
    serviceClient: serviceClient
      ? transformBackendServiceClient(serviceClient)
      : undefined,
  };

  const type = serviceClient?.type || "oauth";

  switch (type) {
    case "oauth":
      return {
        ...baseConnection,
        type: "oauth",
        credentials: backendData.credentials || {},
        metadata: backendData.metadata || {},
      } as OAuthConnection;

    case "secret_sharing":
      return {
        ...baseConnection,
        type: "secret_sharing",
        credentials: backendData.credentials || {},
        metadata: {
          host:
            extractHostFromCredentials(backendData.credentials) ||
            backendData.metadata?.host,
          status: backendData.metadata?.status || "Idle",
          lastActivity: backendData.metadata?.lastActivity || "Unknown",
          ...backendData.metadata,
        },
      } as DatabaseConnection;

    case "embedded_wallet":
      return {
        ...baseConnection,
        type: "embedded_wallet",
        credentials: backendData.credentials || {},
        metadata: {
          id: backendData.metadata?.id || backendData.uniqueId,
          walletAddress: extractWalletAddress(backendData.metadata),
          ...backendData.metadata,
        },
        policy: backendData.policy,
      } as WalletConnection;

    default:
      return {
        ...baseConnection,
        type: "oauth",
        credentials: {},
        metadata: {},
      } as OAuthConnection;
  }
};

function extractHostFromCredentials(credentials: any): string | undefined {
  if (!credentials) return undefined;

  const hostFields = ["host", "hostname", "server", "endpoint", "url"];
  for (const field of hostFields) {
    if (credentials[field]) return credentials[field];
  }
  return undefined;
}

function extractWalletAddress(metadata: any): string | undefined {
  if (!metadata) return undefined;

  if (metadata.walletAddress) return metadata.walletAddress;
  if (metadata.address) return metadata.address;
  if (metadata.accounts?.[0]?.addresses?.[0]?.address) {
    return metadata.accounts[0].addresses[0].address;
  }
  return undefined;
}
