export interface ServiceClient {
  clientId: string;
  name: string;
  description: string;
  type: "oauth" | "secret_sharing" | "embedded_wallet";
  supportedScopes: string[];
  scopeDefinitions: Record<string, string>;
  supportedServices: string[];
  metadata: any;
  embedding?: any | null;
  iconUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BaseUserServiceConnection {
  id: string;
  clientId: string;
  userId: string;
  uniqueId: string;
  name: string;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
  serviceClient?: ServiceClient;
}

export interface OAuthConnection extends BaseUserServiceConnection {
  type: "oauth";
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    idToken?: string;
    tokenType?: string;
  };
  metadata: {
    user?: {
      id: string;
      email?: string;
      name?: string;
      avatar?: string;
      uniqueId: string;
    };
  };
}

export interface DatabaseConnection extends BaseUserServiceConnection {
  type: "secret_sharing";
  credentials: Record<string, any>;
  metadata: {
    host?: string;
    port?: number;
    database?: string;
    lastActivity?: string;
    status?: "Active" | "Idle" | "Error";
  };
}

export interface WalletConnection extends BaseUserServiceConnection {
  type: "embedded_wallet";
  credentials: {
    authenticators?: {
      apiKeyName: string;
      publicKey: string;
      curveType: string;
    };
  };
  metadata: {
    id: string;
    walletAddress?: string;
    balance?: string;
    chain?: string;
    accounts?: {
      id: string;
      addresses: Array<{
        chains: string[];
        address: string;
        derivationPath: string;
        curve: string;
        addressFormat: string;
      }>;
      chains: string[];
    };
  };
  policy?: {
    allow: any[];
    deny: any[];
  };
}

export type UserServiceConnection =
  | OAuthConnection
  | DatabaseConnection
  | WalletConnection;

export const isOAuthConnection = (
  conn: UserServiceConnection,
): conn is OAuthConnection => {
  return conn.type === "oauth";
};

export const isDatabaseConnection = (
  conn: UserServiceConnection,
): conn is DatabaseConnection => {
  return conn.type === "secret_sharing";
};

export const isWalletConnection = (
  conn: UserServiceConnection,
): conn is WalletConnection => {
  return conn.type === "embedded_wallet";
};

export type Permission = {
  id: string;
  label: string;
};

export interface OAuthFormData {
  id: string;
  name: string;
  scopes: string[];
  clientId: string;
}

export interface DatabaseFormData {
  id: string;
  name: string;
  host: string;
  status: "Active" | "Idle" | "Error";
  lastActivity?: string;
}

export interface WalletFormData {
  id: string;
  name: string;
  addresses: Array<{
    address: string;
    chains: string[];
    curve: string;
    addressFormat: string;
    derivationPath: string;
  }>;
  chains: string[];
  balance?: string;
}

export type ConnectionFormData =
  | OAuthFormData
  | DatabaseFormData
  | WalletFormData;

export const connectionToFormData = (
  connection: UserServiceConnection,
): ConnectionFormData => {
  switch (connection.type) {
    case "oauth":
      return {
        id: connection.id,
        name: connection.name,
        scopes: connection.scopes,
        clientId: connection.clientId,
      };

    case "secret_sharing":
      return {
        id: connection.id,
        name: connection.name,
        host: connection.metadata.host || "",
        status: connection.metadata.status || "Idle",
        lastActivity: connection.metadata.lastActivity,
      };

    case "embedded_wallet":
      const accounts = connection.metadata.accounts;
      const addresses = accounts?.addresses || [];
      const chains = accounts?.chains || [];

      return {
        id: connection.id,
        name: connection.name,
        addresses: addresses.map((addr: any) => ({
          address: addr.address || "",
          chains: addr.chains || [],
          curve: addr.curve || "",
          addressFormat: addr.addressFormat || "",
          derivationPath: addr.derivationPath || "",
        })),
        chains: chains,
        balance: connection.metadata.balance,
      };
  }
};

export const getConnectionDisplayInfo = (connection: UserServiceConnection) => {
  const baseInfo = {
    id: connection.id,
    name: connection.name,
    type: connection.type,
    serviceName: connection.serviceClient?.name || "Unknown",
    iconUrl: connection.serviceClient?.iconUrl,
  };

  switch (connection.type) {
    case "oauth":
      return {
        ...baseInfo,
        subtitle: `${connection.scopes.length} scopes`,
        status: connection.credentials.expiresAt
          ? new Date(connection.credentials.expiresAt) > new Date()
            ? "Active"
            : "Expired"
          : "Active",
        details: connection.metadata.user?.email || connection.uniqueId,
      };

    case "secret_sharing":
      return {
        ...baseInfo,
        subtitle: connection.metadata.host || "Database connection",
        status: connection.metadata.status || "Unknown",
        details: connection.metadata.host,
      };

    case "embedded_wallet":
      const primaryAddress = connection.metadata.accounts?.addresses?.[0]?.address;
      return {
        ...baseInfo,
        subtitle: primaryAddress || "Wallet connection",
        status: "Active",
        details: primaryAddress,
      };
  }
};
