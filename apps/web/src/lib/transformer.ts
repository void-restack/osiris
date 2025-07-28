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
  return backendData.map((item) => {
    const connection = item.user_service_connections;
    const serviceClient = item.service_clients;

    const baseConnection = {
      id: connection.id,
      clientId: connection.clientId,
      userId: connection.userId,
      uniqueId: connection.uniqueId || connection.id,
      name: connection.name || serviceClient.name,
      scopes: connection.scopes || [],
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

export const generateMockConnections = (
  serviceClient: ServiceClient,
): UserServiceConnection[] => {
  const baseId = Date.now().toString();

  switch (serviceClient.type) {
    case "secret_sharing":
      return [
        {
          id: baseId + "1",
          clientId: serviceClient.clientId,
          userId: "user-123",
          uniqueId: "marketing-db",
          name: "Marketing DB",
          type: "secret_sharing",
          scopes: [],
          credentials: { host: "db.marketing.com", port: 5432 },
          metadata: {
            host: "db.marketing.com",
            status: "Active",
            lastActivity: "2 hours ago",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          serviceClient,
        },
        {
          id: baseId + "2",
          clientId: serviceClient.clientId,
          userId: "user-123",
          uniqueId: "backup-db",
          name: "Backup DB",
          type: "secret_sharing",
          scopes: [],
          credentials: { host: "backup.pgsql.net", port: 5432 },
          metadata: {
            host: "backup.pgsql.net",
            status: "Idle",
            lastActivity: "15 mins ago",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          serviceClient,
        },
      ] as DatabaseConnection[];

    case "oauth":
      return [
        {
          id: baseId + "1",
          clientId: serviceClient.clientId,
          userId: "user-123",
          uniqueId: "github-connection",
          name: `${serviceClient.name} Connection`,
          type: "oauth",
          scopes: serviceClient.supportedScopes.slice(0, 3),
          credentials: {
            accessToken: "token-123",
            refreshToken: "refresh-123",
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          },
          metadata: {
            user: {
              id: "user-123",
              email: "user@example.com",
              name: "John Doe",
              uniqueId: "github-user-123",
            },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          serviceClient,
        },
      ] as OAuthConnection[];

    case "embedded_wallet":
      return [
        {
          id: baseId + "1",
          clientId: serviceClient.clientId,
          userId: "user-123",
          uniqueId: "primary-wallet",
          name: "Primary Wallet",
          type: "embedded_wallet",
          scopes: [],
          credentials: {
            authenticators: {
              apiKeyName: "osiris-api-key",
              publicKey: "public-key-123",
              curveType: "API_KEY_CURVE_P256",
            },
          },
          metadata: {
            id: "wallet-123",
            walletAddress: "0x1234567890abcdef",
            balance: "1.5 ETH",
            chain: "ethereum",
          },
          policy: { allow: [], deny: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          serviceClient,
        },
      ] as WalletConnection[];

    default:
      return [];
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
