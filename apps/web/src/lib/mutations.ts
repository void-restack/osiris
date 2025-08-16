import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  knowledgeBaseSchema,
  packageSchema,
  responseSchema,
  userSchema,
} from "@/types";
import { api } from "./api";
import {
  creditQueries,
  hubQueries,
  knowledgeQueries,
  packageQueries,
  userQueries,
} from "./queries";
import { toast } from "sonner";

// ===== USER MUTATIONS =====
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      role: "admin" | "developer" | "viewer" | "super_admin";
    }) => {
      const response = await api("/users", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            user: userSchema,
            tokens: z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
              expiresAtAccess: z.string().datetime(),
              expiresAtRefresh: z.string().datetime(),
            }),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating user...", { id: "create-user" });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userQueries.me(), data.user);
      toast.success("User created successfully", { id: "create-user" });
    },
    onError: (error) => {
      console.error("Failed to create user:", error);
      toast.error(`Failed to create user: ${error.message}`, { id: "create-user" });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      role?: "admin" | "developer" | "viewer" | "super_admin";
    }) => {
      const response = await api("/users", {
        method: "PUT",
        body: data,
        schema: responseSchema(userSchema),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: userQueries.me() });
      const previousData = queryClient.getQueryData(userQueries.me());
      queryClient.setQueryData(userQueries.me(), (old: any) => ({ ...old, ...newData }));
      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userQueries.me(), data);
      toast.success("User updated successfully");
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(userQueries.me(), context?.previousData);
      console.error("Failed to update user:", error);
      toast.error(`Failed to update user: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.me() });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api("/users", { method: "DELETE" });
      return response;
    },
    onMutate: () => {
      toast.loading("Deleting account...", { id: "delete-user" });
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("Account deleted successfully", { id: "delete-user" });
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Failed to delete user:", error);
      toast.error(`Failed to delete account: ${error.message}`, { id: "delete-user" });
    },
  });
};

export const useDisconnectOAuthMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const response = await api("/users/auth/disconnect", {
        method: "DELETE",
        params: { provider },
      });
      return response;
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: userQueries.authProviders() });
      toast.success(`Disconnected ${provider} successfully`);
    },
    onError: (error, provider) => {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast.error(`Failed to disconnect ${provider}: ${error.message}`);
    },
  });
};

export const useUploadFilesMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      files: Array<{
        filename: string;
        contentType: string;
        size: number;
      }>;
    }) => {
      const response = await api("/users/upload-files", {
        method: "POST",
        body: data,
        schema: responseSchema(z.array(z.object({
          filename: z.string(),
          uploadUrl: z.string().url(),
          fileId: z.string().uuid(),
        }))),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Uploading files...", { id: "upload-files" });
    },
    onSuccess: (data) => {
      toast.success(`Uploaded ${data.length} files successfully`, { id: "upload-files" });
    },
    onError: (error) => {
      console.error("Failed to upload files:", error);
      toast.error(`Failed to upload files: ${error.message}`, { id: "upload-files" });
    },
  });
};

// ===== AUTH MUTATIONS =====
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      provider: 'google' | 'github';
      redirectUri?: string;
    }) => {
      const response = await api("/users/auth/url", {
        method: "GET",
        params: { type: data.provider, redirectUri: data.redirectUri ?? "http://localhost:3000/auth" },
        schema: responseSchema(z.object({ url: z.string().url() })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error("Failed to generate login URL:", error);
      toast.error(`Login failed: ${error.message}`);
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api("/users/auth/revoke-refresh", { method: "POST" });
    },
    onMutate: () => {
      toast.loading("Signing out...", { id: "logout" });
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("Signed out successfully", { id: "logout" });
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Failed to logout:", error);
      toast.error(`Logout failed: ${error.message}`, { id: "logout" });
    },
  });
};

export const useRefreshTokenMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api("/users/auth/refresh", {
        method: "POST",
        schema: responseSchema(
          z.object({
            accessToken: z.string(),
            expiresAt: z.string().datetime(),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Failed to refresh token:", error);
    },
  });
};

export const useExchangeTokenMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      grant_type: "authorization_code" | "refresh_token";
      code?: string;
      refresh_token?: string;
      client_id: string;
      client_secret: string;
      redirect_uri?: string;
    }) => {
      const response = await api("/hub/token", {
        method: "POST",
        body: data,
        schema: responseSchema(z.object({
          access_token: z.string(),
          refresh_token: z.string(),
          expires_in: z.number(),
          token_type: z.string(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Failed to exchange token:", error);
      toast.error(`Token exchange failed: ${error.message}`);
    },
  });
};

export const useRevokeTokenMutation = () => {
  return useMutation({
    mutationFn: async (data: { token: string; tokenTypeHint?: string }) => {
      const response = await api("/hub/revoke", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      toast.success("Token revoked successfully");
    },
    onError: (error) => {
      console.error("Failed to revoke token:", error);
      toast.error(`Failed to revoke token: ${error.message}`);
    },
  });
};

// ===== HUB MUTATIONS =====
export const useAddWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      walletId: string;
      accountId: string;
      addresses: Array<{
        chains: string[];
        pathFormat: string;
        path: string;
        curve: string;
        addressFormat: string;
      }>;
    }) => {
      const response = await api("/hub/wallet/add", {
        method: "PATCH",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuthConnection(variables.id) });
      toast.success("Wallet added successfully");
    },
    onError: (error) => {
      console.error("Failed to add wallet:", error);
      toast.error(`Failed to add wallet: ${error.message}`);
    },
  });
};

export const useCreateServiceConnectionMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      serviceClientName: string;
      scopes: string[];
      redirectUri?: string;
    }) => {
      const response = await api("/hub/auth/url", {
        method: "GET",
        params: {
          type: data.serviceClientName,
          scopes: data.scopes.join(","),
          name: data.name ?? `Updated ${data.serviceClientName} connection`,
          redirectUri: data?.redirectUri ?? "http://localhost:3000/auth",
        },
        schema: responseSchema(z.object({ url: z.string().url() })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error("Failed to create service connection:", error);
      toast.error(`Failed to create service connection: ${error.message}`);
    },
  });
};

export const useDisconnectServiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userServiceConnectionId: string) => {
      const response = await api("/hub/auth/disconnect", {
        method: "DELETE",
        params: { userServiceConnetionId: userServiceConnectionId },
      });
      return response;
    },
    onSuccess: (_, userServiceConnectionId) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuthConnection(userServiceConnectionId) });
      toast.success("Service disconnected successfully");
    },
    onError: (error) => {
      console.error("Failed to disconnect service:", error);
      toast.error(`Failed to disconnect service: ${error.message}`);
    },
  });
};

export const useCreateSecretSharingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serviceClientId: string;
      name?: string;
      secret: Record<string, any>;
    }) => {
      const payload = {
        serviceClientId: data.serviceClientId,
        name: data.name || 'Database Connection',
        secret: data.secret
      };

      const response = await api("/hub/secret/create", {
        method: "POST",
        body: payload,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating secret...", { id: "create-secret" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
      toast.success("Secret created successfully", { id: "create-secret" });
    },
    onError: (error) => {
      console.error("Failed to create secret:", error);
      toast.error(`Failed to create secret: ${error.message}`, { id: "create-secret" });
    },
  });
};

export const useUpdateSecretSharingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      secret: Record<string, any>;
    }) => {
      const response = await api("/hub/secret/update", {
        method: "PATCH",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hubQueries.userAuthConnection(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
      toast.success("Secret updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update secret:", error);
      toast.error(`Failed to update secret: ${error.message}`);
    },
  });
};

export const useCreateWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      accounts: Array<{
        chains: string[];
        pathFormat: string;
        path: string;
        curve: string;
        addressFormat: string;
      }>;
    }) => {
      const response = await api("/hub/wallet/create", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating wallet...", { id: "create-wallet" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
      if (data.connectionId) {
        queryClient.invalidateQueries({ queryKey: hubQueries.userAuthConnection(data.connectionId) });
      }
      toast.success("Wallet created successfully", { id: "create-wallet" });
    },
    onError: (error) => {
      console.error("Failed to create wallet:", error);
      toast.error(`Failed to create wallet: ${error.message}`, { id: "create-wallet" });
    },
  });
};

export const useUpdateWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; policy: Record<string, any> }) => {
      const response = await api("/hub/wallet/update", {
        method: "PATCH",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hubQueries.userAuthConnection(variables.id),
      });
      toast.success("Wallet updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update wallet:", error);
      toast.error(`Failed to update wallet: ${error.message}`);
    },
  });
};

export const useAddWalletAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      walletId: string;
      accountId: string;
      addresses: Array<{
        chains: string[];
        pathFormat: string;
        path: string;
        curve: string;
        addressFormat: string;
      }>;
    }) => {
      const response = await api("/wallet/add", {
        method: "PATCH",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hubQueries.userAuthConnection(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
      toast.success("Wallet account added successfully");
    },
    onError: (error) => {
      console.error("Failed to add wallet account:", error);
      toast.error(`Failed to add wallet account: ${error.message}`);
    },
  });
};

// OAuth Client Management
export const useCreateOAuthClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      redirectUris: string[];
      metadata?: Record<string, any>;
    }) => {
      const response = await api("/hub/oauth-clients", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            clientId: z.string().uuid(),
            developerId: z.string().uuid(),
            name: z.string(),
            redirectUris: z.array(z.string().url()),
            metadata: z.record(z.any()),
            createdAt: z.string(),
            updatedAt: z.string(),
            clientSecret: z.string(),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating OAuth client...", { id: "create-oauth-client" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() });
      toast.success("OAuth client created successfully", { id: "create-oauth-client" });
    },
    onError: (error) => {
      console.error("Failed to create OAuth client:", error);
      toast.error(`Failed to create OAuth client: ${error.message}`, { id: "create-oauth-client" });
    },
  });
};

export const useUpdateOAuthClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      clientId: string;
      name?: string;
      redirectUris?: string[];
      metadata?: Record<string, any>;
    }) => {
      const { clientId, ...updateData } = data;
      const response = await api(`/hub/oauth-clients/${clientId}`, {
        method: "PUT",
        body: updateData,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClient(variables.clientId) });
      toast.success("OAuth client updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update OAuth client:", error);
      toast.error(`Failed to update OAuth client: ${error.message}`);
    },
  });
};

export const useDeleteOAuthClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await api(`/hub/oauth-clients/${clientId}`, {
        method: "DELETE",
        schema: z.object({
          status: z.literal("SUCCESS"),
          message: z.string(),
        }),
      });
      return response;
    },
    onSuccess: (data, clientId) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() });
      queryClient.removeQueries({ queryKey: hubQueries.oauthClient(clientId) });
      toast.success(data.message || "OAuth client deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete OAuth client:", error);
      toast.error(error.message || "Failed to delete OAuth client");
    },
  });
};

export const useRegenerateOAuthSecretMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await api(
        `/hub/oauth-clients/${clientId}/regenerate-secret`,
        {
          method: "POST",
          schema: responseSchema(
            z.object({
              clientId: z.string().uuid(),
              developerId: z.string().uuid(),
              name: z.string(),
              redirectUris: z.array(z.string()),
              metadata: z.record(z.any()),
              createdAt: z.string(),
              updatedAt: z.string(),
              clientSecret: z.string(),
            }),
          ),
        },
      );
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, clientId) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClient(clientId) });
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() });
      toast.success("Client secret regenerated successfully");
    },
    onError: (error) => {
      console.error("Failed to regenerate client secret:", error);
      toast.error(error.message || "Failed to regenerate client secret");
    },
  });
};

// OAuth Authorization
export const useAuthorizeOsirisMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      clientId: string;
      redirectUri: string;
      responseType: 'code';
      scopes: string[];
      state: string;
      deploymentId?: string;
    }) => {
      const response = await api("/hub/authorize", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            code: z.string(),
            state: z.string(),
          })
        ),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Authorization successful:', data);
      toast.success("Authorization successful");
    },
    onError: (error) => {
      console.error("Authorization failed:", error);
      toast.error(`Authorization failed: ${error.message}`);
    },
  });
};

export const useAuthorizeFrontendMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      clientId: string;
      redirectUri: string;
      responseType: 'code';
      scopes: string[];
      state: string;
      deploymentId?: string;
    }) => {
      const response = await api("/hub/authorize?type=consent_frontend", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            code: z.string(),
            state: z.string(),
          })
        ),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Authorization successful:', data);
      toast.success("Authorization successful");
    },
    onError: (error) => {
      console.error("Authorization failed:", error);
      toast.error(`Authorization failed: ${error.message}`);
    },
  });
};

export const useExecuteMcpActionMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      deploymentId: string;
      service: string;
      path: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: any;
    }) => {
      const { deploymentId, service, path, method, body } = data;
      const response = await api(
        `/hub/action/${deploymentId}/${service}${path}`,
        {
          method,
          body,
        },
      );
      return response;
    },
    onError: (error) => {
      console.error("MCP action failed:", error);
      toast.error(`Action failed: ${error.message}`);
    },
  });
};

// ===== PACKAGE MUTATIONS =====
export const useCreatePackageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      clientId: string;
      description: string;
      latestVersion: string;
      metadata: any;
      externalSource: {
        sourceType: "pypi" | "npm" | "github";
        sourceIdentifier: string;
      };
      supportedServiceClients: Array<{
        serviceClientId: string;
        scopes: string[];
        policy?: Record<string, any>;
      }>;
    }) => {
      const response = await api("/packages", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            package: packageSchema,
            externalSource: z.any(),
            supportedServiceClients: z.array(z.any()),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating package...", { id: "create-package" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() });
      toast.success(`Package "${data.package.name}" created successfully`, { id: "create-package" });
    },
    onError: (error) => {
      console.error("Failed to create package:", error);
      toast.error(`Failed to create package: ${error.message}`, { id: "create-package" });
    },
  });
};

export const useUpdatePackageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      packageId: string;
      name?: string;
      description?: string;
      latestVersion?: string;
      metadata?: any;
      externalSource?: {
        sourceType: "pypi" | "npm" | "github";
        sourceIdentifier: string;
      };
      supportedServiceClients?: Array<{
        serviceClientId: string;
        scopes: string[];
        policy?: Record<string, any>;
      }>;
    }) => {
      const { packageId, ...updateData } = data;
      const response = await api(`/packages/${packageId}`, {
        method: "PATCH",
        body: updateData,
        schema: responseSchema(
          z.object({
            package: packageSchema,
            externalSource: z.any().nullable(),
            supportedServiceClients: z.array(z.any()),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.detail(variables.packageId) });
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() });
      toast.success(`Package "${data.package.name}" updated successfully`);
    },
    onError: (error) => {
      console.error("Failed to update package:", error);
      toast.error(`Failed to update package: ${error.message}`);
    },
  });
};

export const useDeletePackageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      const response = await api(`/packages/${packageId}`, {
        method: "DELETE",
        schema: responseSchema(z.object({ message: z.string() })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, packageId) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() });
      queryClient.removeQueries({ queryKey: packageQueries.detail(packageId) });
      toast.success(data.message || "Package deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete package:", error);
      toast.error(`Failed to delete package: ${error.message}`);
    },
  });
};

export const useInstallPackageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { packageId: string; version: string }) => {
      const response = await api("/packages/install", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            userMcpId: z.string().uuid(),
            userId: z.string().uuid(),
            packageId: z.string().uuid(),
            version: z.string(),
            installedAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Installing package...", { id: "install-package" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.userInstalled() });
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      toast.success("Package installed successfully", { id: "install-package" });
    },
    onError: (error) => {
      console.error("Failed to install package:", error);
      toast.error(`Installation failed: ${error.message}`, { id: "install-package" });
    },
  });
};

export const useDeployPackageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      packageId: string;
      version: string;
      url: string;
      name?: string;
      scopes: string[];
      authData: any;
      connectionIds: string[];
    }) => {
      const response = await api("/packages/deploy", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            deployment: z.any(),
            serviceConnectionAssociations: z.array(z.any()),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Deploying package...", { id: "deploy-package" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.userDeployments() });
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      toast.success("Package deployed successfully", { id: "deploy-package" });
    },
    onError: (error) => {
      console.error("Failed to deploy package:", error);
      toast.error(`Deployment failed: ${error.message}`, { id: "deploy-package" });
    },
  });
};

export const useUpdateDeploymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      deploymentId: string;
      name?: string;
      connections?: Record<string, { scopes: string[] }>;
    }) => {
      const { deploymentId, ...updateData } = data;
      const response = await api(`/packages/deployments/${deploymentId}`, {
        method: "PATCH",
        body: updateData,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.deployment(variables.deploymentId) });
      queryClient.invalidateQueries({ queryKey: packageQueries.userDeployments() });
      // if (variables.packageId) {
      //   queryClient.invalidateQueries({ queryKey: packageQueries.userDeploymentsForPackage(variables.packageId) });
      // }
      toast.success("Deployment updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update deployment:", error);
      toast.error(`Failed to update deployment: ${error.message}`);
    },
  });
};

export const useUpdateDeploymentPolicyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      deploymentId: string;
      policy: { allow: any[]; deny: any[] };
    }) => {
      const response = await api(`/packages/deployments/${data.deploymentId}/update-policy`, {
        method: "PATCH",
        body: { policy: data.policy },
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.deployment(variables.deploymentId) });
      queryClient.invalidateQueries({ queryKey: packageQueries.userDeployments() });
      toast.success("Deployment policy updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update deployment policy:", error);
      toast.error(`Failed to update policy: ${error.message}`);
    },
  });
};

export const useValidatePolicyMutation = () => {
  return useMutation({
    mutationFn: async (data: { policy: any; action: any }) => {
      const response = await api("/packages/validate-policy", {
        method: "POST",
        body: data,
        schema: responseSchema(z.object({
          valid: z.boolean(),
          reason: z.string().optional(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Policy validation failed:", error);
      toast.error(`Policy validation failed: ${error.message}`);
    },
  });
};

// ===== CREDIT MUTATIONS =====
export const useGetRecentTransactionsMutation = () => {
  return useMutation({
    mutationFn: async (walletId: string) => {
      const response = await api(`/hub/defi/transactions/${walletId}`, {
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Failed to get recent transactions:", error);
      toast.error(`Failed to get transactions: ${error.message}`);
    },
  });
};

export const useHelioDepositMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: string;
      paymentMethod: "helio_web3";
      userEmail?: string;
      chargeType?: "paylink" | "charge";
    }) => {
      const response = await api("/credits/deposit/helio", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            type: z.enum(["charge", "paylink"]),
            chargeId: z.string().optional(),
            payLinkId: z.string().optional(),
            chargeToken: z.string().optional(),
            paymentUrl: z.string().url(),
            amount: z.string(),
            expiresAt: z.string().optional(),
            instructions: z.object({
              frontend: z.object({
                useCheckoutWidget: z.boolean(),
                config: z.record(z.any()),
              }),
              manual: z.object({
                description: z.string(),
                url: z.string().url(),
              }),
            }),
          }),
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating deposit...", { id: "helio-deposit" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      queryClient.invalidateQueries({ queryKey: creditQueries.deposits() });
      toast.success(`Deposit of $${data.amount} created successfully`, { id: "helio-deposit" });
    },
    onError: (error) => {
      console.error("Failed to create Helio deposit:", error);
      toast.error(`Deposit failed: ${error.message}`, { id: "helio-deposit" });
    },
  });
};

export const useStripeDepositMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: string;
      paymentMethod: "stripe_card";
      currency?: "USD" | "EUR" | "GBP";
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const response = await api("/credits/deposit/stripe", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating Stripe deposit...", { id: "stripe-deposit" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      queryClient.invalidateQueries({ queryKey: creditQueries.deposits() });
      toast.success(`Deposit of $${data.amount} created successfully`, { id: "stripe-deposit" });
    },
    onError: (error) => {
      console.error("Failed to create Stripe deposit:", error);
      toast.error(`Deposit failed: ${error.message}`, { id: "stripe-deposit" });
    },
  });
};

export const useCashoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      creditAmount: string;
      payoutMethod: "crypto" | "bank" | "paypal";
      payoutDetails: {
        stableCoin?: "USDC" | "USDT";
        networkName?: "solana" | "base" | "ethereum" | "bitcoin";
        address?: string;
        routingNumber?: string;
        accountNumber?: string;
        accountType?: "checking" | "savings";
        email?: string;
      };
    }) => {
      const response = await api("/credits/cashout", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Processing cashout...", { id: "cashout" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      queryClient.invalidateQueries({ queryKey: creditQueries.cashouts() });
      toast.success(`Cashout of $${data.creditAmount} initiated successfully`, { id: "cashout" });
    },
    onError: (error) => {
      console.error("Failed to process cashout:", error);
      toast.error(`Cashout failed: ${error.message}`, { id: "cashout" });
    },
  });
};

// ===== KNOWLEDGE BASE MUTATIONS =====
export const useCreateKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      tags: string[];
      iconUrl?: string;
      coverImageUrl?: string;
      isPublic?: boolean;
      publicMetadata?: { price: number };
    }) => {
      const response = await api("/knowledge-base", {
        method: "POST",
        body: data,
        schema: responseSchema(knowledgeBaseSchema),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Creating knowledge base...", { id: "create-kb" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.bases() });
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.my() });
      toast.success(`Knowledge base "${data.name}" created successfully`, { id: "create-kb" });
    },
    onError: (error) => {
      console.error("Failed to create knowledge base:", error);
      toast.error(`Failed to create knowledge base: ${error.message}`, { id: "create-kb" });
    },
  });
};

export const useAddKnowledgeSourceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      knowledgeBaseId: string;
      sourceType: "url" | "file" | "text" | "image" | "youtube_url";
      source?: string;
      file?: File;
    }) => {
      const formData = new FormData();
      formData.append("sourceType", data.sourceType);
      if (data.source) formData.append("source", data.source);
      if (data.file) formData.append("file", data.file);

      const response = await api(
        `/knowledge-base/${data.knowledgeBaseId}/add-source`,
        {
          method: "POST",
          body: formData,
          schema: responseSchema(z.any()),
        },
      );
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Adding source...", { id: "add-source" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.sources(variables.knowledgeBaseId) });
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.base(variables.knowledgeBaseId) });
      toast.success("Source added successfully", { id: "add-source" });
    },
    onError: (error) => {
      console.error("Failed to add knowledge source:", error);
      toast.error(`Failed to add source: ${error.message}`, { id: "add-source" });
    },
  });
};

export const useAddKnowledgeUnitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      knowledgeSourceId: string;
      name: string;
      content: string;
      tags: string[];
      type: string;
    }) => {
      const response = await api("/knowledge-base/add-knowledge-unit", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.units(data.knowledgeBaseId) });
      toast.success(`Knowledge unit "${data.name}" added successfully`);
    },
    onError: (error) => {
      console.error("Failed to add knowledge unit:", error);
      toast.error(`Failed to add knowledge unit: ${error.message}`);
    },
  });
};

export const useRetryKnowledgeSourceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (knowledgeSourceId: string) => {
      const response = await api(
        `/knowledge-base/${knowledgeSourceId}/retry-source`,
        {
          method: "POST",
          schema: responseSchema(z.any()),
        },
      );
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.sources(data.knowledgeBaseId) });
      toast.success("Source processing restarted");
    },
    onError: (error) => {
      console.error("Failed to retry knowledge source:", error);
      toast.error(`Failed to retry source: ${error.message}`);
    },
  });
};

export const useUpdateKnowledgeUnitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      knowledgeUnitId: string;
      name?: string;
      content?: string;
      tags?: string[];
      type?: string;
    }) => {
      const { knowledgeUnitId, ...updateData } = data;
      const response = await api(`/knowledge-base/${knowledgeUnitId}`, {
        method: "PATCH",
        body: updateData,
        schema: responseSchema(z.string()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.units(data.knowledgeBaseId) });
      toast.success("Knowledge unit updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update knowledge unit:", error);
      toast.error(`Failed to update knowledge unit: ${error.message}`);
    },
  });
};

export const useDeleteKnowledgeUnitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (knowledgeUnitId: string) => {
      const response = await api(`/knowledge-base/${knowledgeUnitId}`, {
        method: "DELETE",
        schema: responseSchema(z.string()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.units(data.knowledgeBaseId) });
      toast.success("Knowledge unit deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete knowledge unit:", error);
      toast.error(`Failed to delete knowledge unit: ${error.message}`);
    },
  });
};

export const useRateKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { knowledgeBaseId: string; rating: number }) => {
      const response = await api(`/knowledge-base/${data.knowledgeBaseId}/rate`, {
        method: "POST",
        body: { rating: data.rating },
        schema: responseSchema(z.object({
          averageRating: z.number(),
          totalRatings: z.number(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeQueries.base(variables.knowledgeBaseId),
      });
      queryClient.invalidateQueries({
        queryKey: knowledgeQueries.bases(),
      });
      toast.success(`Rated ${variables.rating} stars successfully`);
    },
    onError: (error) => {
      console.error("Failed to rate knowledge base:", error);
      toast.error(`Failed to rate knowledge base: ${error.message}`);
    },
  });
};

export const useBuyKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (knowledgeBaseId: string) => {
      const response = await api(`/knowledge-base/${knowledgeBaseId}/install`, {
        method: "POST",
        schema: responseSchema(z.object({
          success: z.boolean(),
          message: z.string(),
          knowledgeBaseId: z.string().uuid(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: () => {
      toast.loading("Installing knowledge base...", { id: "install-kb" });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.installed(variables) });
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.allInstalled() });
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      toast.success("Knowledge base installed successfully", { id: "install-kb" });
    },
    onError: (error) => {
      console.error("Failed to install knowledge base:", error);
      toast.error(`Installation failed: ${error.message}`, { id: "install-kb" });
    },
  });
};