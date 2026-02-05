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
  chatQueries,
  creditQueries,
  hubQueries,
  knowledgeQueries,
  packageQueries,
  userQueries,
} from "./queries";
import { toast } from "sonner";
import { useAppStore } from "./store";

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
    onSuccess: (data) => {
      queryClient.setQueryData(userQueries.me(), data.user);
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      role?: "admin" | "developer" | "viewer" | "super_admin";
      username?: string;
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
    onSuccess: (data) => {
      queryClient.setQueryData(userQueries.me(), data);
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
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.all() });
    },
  });
};

// Upload Files
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
  });
};

// ===== AUTH MUTATIONS =====
// export const useLoginMutation = () => {
//   return useMutation({
//     mutationFn: async (provider: "google" | "github") => {
//       const response = await api("/users/auth/url", {
//         method: "GET",
//         params: { type: provider },
//         schema: responseSchema(z.object({ url: z.string().url() })),
//       });
//       if (response.status === "FAILED") {
//         throw new Error(response.error);
//       }
//       return response.data;
//     },
//     onSuccess: (data) => {
//       // Redirect to OAuth URL
//       window.location.href = data.url;
//     },
//   });
// };

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
      // Redirect to OAuth URL
      window.location.href = data.url;
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api("/users/auth/revoke-refresh", { method: "POST" });
      // document.cookie = 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
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
    onSuccess: (data) => {
      // Token is now handled by cookies
    },
  });
};

// OAuth Token Exchange
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
  });
};

// Revoke Token
export const useRevokeTokenMutation = () => {
  return useMutation({
    mutationFn: async (data: { token: string; tokenTypeHint?: string }) => {
      const response = await api("/hub/revoke", {
        method: "POST",
        body: data,
      });
      return response;
    },
  });
};

// Add Wallet
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
    onSuccess: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
    },
  });
};

export const useCreateServiceConnectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      serviceClientName: string;
      scopes: string[];
      profileId: string;
      redirectUri?: string;
      preventRedirect?: boolean;
      authType?: 'frontend' | 'app' | 'cli';
    }) => {
      const response = await api("/hub/auth/url", {
        method: "GET",
        params: {
          type: data.serviceClientName,
          scopes: data.scopes.join(","),
          name: data.name,
          profileId: data.profileId,
          authType: data.authType ?? 'frontend',
          redirectUri: data?.redirectUri ?? "http://localhost:3000/auth",
        },
        schema: responseSchema(z.object({ url: z.string().url() })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      const isPopup = variables.redirectUri?.includes('popup=true');
      const shouldPreventRedirect = variables.preventRedirect === true;

      if (!isPopup && !shouldPreventRedirect) {
        localStorage.setItem('oauth-pending-refresh', 'true');
        localStorage.setItem('oauth-service-name', variables.serviceClientName);
        window.location.href = data.url;
      }
    },
    onSettled: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
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
    onSuccess: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
    },
  });
};

export const useCreateSecretSharingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serviceClientId: string;
      profileId: string;
      name?: string;
      secret: Record<string, any>;
    }) => {
      const response = await api("/hub/secret/create", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
      toast.success("Secret created successfully");
    },
  });
};

export const useUpdateSecretSharingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userServiceConnectionId: string;
      name?: string;
      secret?: Record<string, any>;
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
    onSuccess: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
      toast.success("Secret updated successfully");
    },
  });
};

export const useCreateWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      profileId: string;
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
    onSuccess: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
      toast.success("Wallet created successfully");
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
    },
  });
};

export const useImportWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      profileId: string;
      mnemonic?: string;
      accounts: Array<{
        chains: string[];
        pathFormat: string;
        path: string;
        curve: string;
        addressFormat: string;
        privateKey?: string;
        keyFormat?: string;
      }>;
    }) => {
      const response = await api("/hub/wallet/import", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
      toast.success("Wallet imported successfully");
    },
  });
};

export const useExportWalletInitMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      address: string;
    }) => {
      const response = await api("/hub/wallet/export/init", {
        method: "POST",
        body: data,
        schema: responseSchema(z.object({
          message: z.string(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("OTP sent to your email");
    },
  });
};

export const useExportWalletVerifyMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      address: string;
      otp: string;
    }) => {
      const response = await api("/hub/wallet/export/verify", {
        method: "POST",
        body: data,
        schema: responseSchema(z.object({
          privateKey: z.string(),
          address: z.string(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
};

export const useSignWalletMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      method: string;
      walletAddress: string;
      chain: string;
      payload: any;
      metadata?: any;
    }) => {
      const response = await api("/hub/wallet/sign", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
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
      const { selectedProfileId } = useAppStore.getState();
      queryClient.invalidateQueries({
        queryKey: hubQueries.userAuthConnection(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth(selectedProfileId || undefined) });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() });
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
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() });
      queryClient.invalidateQueries({
        queryKey: hubQueries.oauthClient(variables.clientId),
      });
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
      // toast.success("Client secret regenerated successfully");
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
      // Handle the authorization success
      console.log('Authorization successful:', data);
    },
  });
};

// Frontend OAuth Authorization
export const useAuthorizeFrontendMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      clientId: string;
      redirectUri: string;
      responseType: 'code';
      scopes: string[];
      state: string;
      deploymentId?: string;
      resource?: string;
      profileId?: string;
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
      // Handle the authorization success
      console.log('Authorization successful:', data);
    },
  });
};

// MCP Action Execution
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() });
      queryClient.invalidateQueries({
        queryKey: packageQueries.detail(variables.packageId),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: packageQueries.userInstalled(),
      });
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
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
      authData: any;
      serviceConnections: Array<{
        connectionId: string;
        scopes?: string[];
        policy?: any;
      }>;
    }) => {
      const response = await api("/packages/deploy", {
        method: "POST",
        body: {
          packageId: data.packageId,
          version: data.version,
          url: data.url,
          authData: data.authData,
          serviceConnections: data.serviceConnections,
        },
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: packageQueries.userDeployments(),
      });
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
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
      queryClient.invalidateQueries({
        queryKey: packageQueries.deployment(variables.deploymentId),
      });
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
      queryClient.invalidateQueries({
        queryKey: packageQueries.deployment(variables.deploymentId),
      });
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
  });
};

// ===== CREDIT MUTATIONS =====
export const useGetRecentTransactionsMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      userServiceConnectionId: string;
      chainIds?: number[];
      limit?: number;
      skipCache?: boolean;
    }) => {
      const params: Record<string, string> = {};
      if (data.chainIds) params.chainIds = data.chainIds.join(',');
      if (data.limit) params.limit = data.limit.toString();
      if (data.skipCache) params.skipCache = 'true';

      const response = await api(`/hub/defi/transactions/${data.userServiceConnectionId}`, {
        params,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      queryClient.invalidateQueries({ queryKey: creditQueries.deposits() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      queryClient.invalidateQueries({ queryKey: creditQueries.deposits() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() });
      queryClient.invalidateQueries({ queryKey: creditQueries.cashouts() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.bases() });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeQueries.sources(variables.knowledgeBaseId),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeQueries.base(variables.knowledgeBaseId),
      });
      queryClient.invalidateQueries({
        queryKey: knowledgeQueries.bases(),
      });
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.installed(variables) });
      toast.success("Installed knowledge base");
    },
    onError: (error) => {
      console.error("Failed to purchase knowledge base:", error);
      toast.error(error.message);
    },
  });
};


// export const useCreateConversationMutation = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (data: {
//       message: string;
//       participants: {
//         participants: Array<{
//           name: string;
//           agentId?: string;
//           knowledgeBaseId?: string;
//         }>;
//       };
//     }) => {
//       const response = await api("/chat/stream", {
//         method: "POST",
//         body: data,
//         schema: responseSchema(
//           z.object({
//             conversationId: z.string().uuid(),
//             message: z.string(),
//             participants: z.array(
//               z.object({
//                 participantId: z.string().uuid(),
//                 name: z.string(),
//                 type: z.enum(["agent", "knowledge_base", "user"]),
//                 agentId: z.string().uuid().optional(),
//                 knowledgeBaseId: z.string().uuid().optional(),
//               })
//             ),
//           })
//         ),
//       });
//       if (response.status === "FAILED") {
//         throw new Error(response.error);
//       }
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: chatQueries.conversations() });
//     },
//   });
// };

export const useAddParticipantsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      participants: Array<{
        name: string;
        agentId?: string;
        knowledgeBaseId?: string;
      }>;
    }) => {
      const { conversationId, ...body } = data;
      const response = await api(`/chat/add-participants/${conversationId}`, {
        method: "POST",
        body,
        schema: responseSchema(
          z.object({
            message: z.string(),
            participants: z.array(
              z.object({
                participantId: z.string().uuid(),
                name: z.string(),
                type: z.enum(["agent", "knowledge_base", "user"]),
                agentId: z.string().uuid().optional(),
                knowledgeBaseId: z.string().uuid().optional(),
              })
            ),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatQueries.conversation(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatQueries.conversations() });
    },
  });
};

export const useRemoveParticipantsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      participantIds: string[];
    }) => {
      const { conversationId, ...body } = data;
      const response = await api(`/chat/remove-participants/${conversationId}`, {
        method: "POST",
        body,
        schema: responseSchema(
          z.object({
            message: z.string(),
            removedParticipants: z.array(z.string().uuid()),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatQueries.conversation(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatQueries.conversations() });
    },
  });
};

export const useDeleteConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await api(`/chat/conversations/${conversationId}`, {
        method: "DELETE",
        schema: responseSchema(
          z.object({
            message: z.string(),
            conversationId: z.string().uuid(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, conversationId) => {
      queryClient.removeQueries({ queryKey: chatQueries.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatQueries.conversations() });
      toast.success(data.message || "Conversation deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete conversation:", error);
      toast.error(error.message || "Failed to delete conversation");
    },
  });
};

export const useCreateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      imageUrl?: string;
      coverImageUrl?: string;
      workflow: Array<{
        name: string;
        deploymentId: string[];
        knowledgeBaseIds?: string[];
        prompt: string;
      }>;
      isPublic?: boolean;
      templateWorkflowId?: string;
      timeBasedTrigger?: {
        rrule: string;
        startTime: string;
      };
    }) => {
      const response = await api("/chat/workflows", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                deploymentId: z.array(z.string().uuid()),
                knowledgeBaseIds: z.array(z.string().uuid()).optional(),
                prompt: z.string(),
              })
            ),
            isPublic: z.boolean(),
            templateWorkflowId: z.string().uuid().optional(),
            timeBasedTrigger: z.object({
              rrule: z.string(),
              startTime: z.string().datetime(),
            }).optional(),
            nextExecution: z.string().datetime().nullable(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueries.workflows() });
      toast.success("Workflow created successfully");
    },
    onError: (error) => {
      console.error("Failed to create workflow:", error);
      toast.error(error.message || "Failed to create workflow");
    },
  });
};

export const useUpdateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workflowId: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      coverImageUrl?: string;
      workflow?: Array<{
        name: string;
        deploymentId: string[];
        knowledgeBaseIds?: string[];
        prompt: string;
      }>;
      isPublic?: boolean;
      templateWorkflowId?: string;
      timeBasedTrigger?: {
        rrule: string;
        startTime: string;
      };
    }) => {
      const { workflowId, ...updateData } = data;
      const response = await api(`/chat/workflows/${workflowId}`, {
        method: "PATCH",
        body: updateData,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                deploymentId: z.array(z.string().uuid()),
                prompt: z.string(),
                knowledgeBaseIds: z.array(z.string()).optional(),
              })
            ),
            isPublic: z.boolean(),
            templateWorkflowId: z.string().uuid().optional(),
            agentId: z.string().uuid().nullable(),
            knowledgeBaseId: z.string().uuid().nullable(),
            serviceClient: z.any().nullable(),
            embedding: z.any().nullable(),
            timeBasedTrigger: z.object({
              rrule: z.string(),
              startTime: z.string().datetime(),
            }).nullable(),
            nextExecution: z.string().datetime().nullable(),
            agents: z.record(z.string(), z.object({
              packageId: z.string().uuid(),
              name: z.string(),
              shortDescription: z.string(),
              url: z.string().url(),
            })).optional(),
            knowledgeBases: z.record(z.string(), z.object({
              id: z.string().uuid(),
              name: z.string(),
              description: z.string().optional(),
            })).optional(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatQueries.workflows() });
      queryClient.invalidateQueries({
        queryKey: chatQueries.workflow(variables.workflowId),
      });
      toast.success("Workflow updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update workflow:", error);
      toast.error(error.message || "Failed to update workflow");
    },
  });
};

export const useDeleteWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await api(`/chat/workflow/${workflowId}`, {
        method: "DELETE",
        schema: responseSchema(
          z.object({
            message: z.string(),
            workflowId: z.string().uuid(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, workflowId) => {
      queryClient.removeQueries({ queryKey: chatQueries.workflow(workflowId) });
      queryClient.invalidateQueries({ queryKey: chatQueries.workflows() });
      toast.success(data.message || "Workflow deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete workflow:", error);
      toast.error(error.message || "Failed to delete workflow");
    },
  });
};

export const useExecuteWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { workflowId: string }) => {
      const response = await api("/chat/workflow/execute", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            jobId: z.string(),
            executionId: z.string().uuid(),
            message: z.string(),
            status: z.string(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatQueries.workflowExecutions(variables.workflowId),
      });
      toast.success(data.message || "Workflow execution started");
    },
    onError: (error) => {
      console.error("Failed to execute workflow:", error);
      toast.error(error.message || "Failed to execute workflow");
    },
  });
};

// ===== TEMPLATE WORKFLOW MUTATIONS =====
export const useCreateTemplateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      imageUrl?: string;
      coverImageUrl?: string;
      workflow: Array<{
        name: string;
        packageIds: string[];
        knowledgeBaseIds?: string[];
        prompt: string;
      }>;
      isPublic?: boolean;
    }) => {
      const response = await api("/chat/template-workflows", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                packageIds: z.array(z.string().uuid()),
                knowledgeBaseIds: z.array(z.string().uuid()).optional(),
                prompt: z.string(),
              })
            ),
            isPublic: z.boolean(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueries.templateWorkflows() });
      toast.success("Template workflow created successfully");
    },
    onError: (error) => {
      console.error("Failed to create template workflow:", error);
      toast.error(error.message || "Failed to create template workflow");
    },
  });
};

export const useUpdateTemplateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      templateId: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      coverImageUrl?: string;
      workflow?: Array<{
        name: string;
        packageIds: string[];
        knowledgeBaseIds?: string[];
        prompt: string;
      }>;
      isPublic?: boolean;
    }) => {
      const { templateId, ...updateData } = data;
      const response = await api(`/chat/template-workflows/${templateId}`, {
        method: "PATCH",
        body: updateData,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                packageIds: z.array(z.string().uuid()),
                knowledgeBaseIds: z.array(z.string().uuid()).optional(),
                prompt: z.string(),
              })
            ),
            isPublic: z.boolean(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatQueries.templateWorkflows() });
      queryClient.invalidateQueries({
        queryKey: chatQueries.templateWorkflow(variables.templateId),
      });
      toast.success("Template workflow updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update template workflow:", error);
      toast.error(error.message || "Failed to update template workflow");
    },
  });
};

export const useDeleteTemplateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api(`/chat/template-workflow/${templateId}`, {
        method: "DELETE",
        schema: responseSchema(
          z.object({
            message: z.string(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, templateId) => {
      queryClient.removeQueries({ queryKey: chatQueries.templateWorkflow(templateId) });
      queryClient.invalidateQueries({ queryKey: chatQueries.templateWorkflows() });
      toast.success(data.message || "Template workflow deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete template workflow:", error);
      toast.error(error.message || "Failed to delete template workflow");
    },
  });
};

export const useCreateWorkflowFromTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      templateWorkflowId: string;
      title: string;
      description: string;
      imageUrl?: string;
      coverImageUrl?: string;
      workflow: Array<{
        name: string;
        deploymentId: string[];
        knowledgeBaseIds?: string[];
        prompt: string;
      }>;
      isPublic?: boolean;
      timeBasedTrigger?: {
        rrule: string;
        startTime: string;
      };
    }) => {
      const response = await api("/chat/workflows", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                deploymentId: z.array(z.string().uuid()),
                knowledgeBaseIds: z.array(z.string().uuid()).optional(),
                prompt: z.string(),
              })
            ),
            isPublic: z.boolean(),
            templateWorkflowId: z.string().uuid().optional(),
            timeBasedTrigger: z.object({
              rrule: z.string(),
              startTime: z.string().datetime(),
            }).optional(),
            nextExecution: z.string().datetime().nullable(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueries.workflows() });
      toast.success("Workflow created from template successfully");
    },
    onError: (error) => {
      console.error("Failed to create workflow from template:", error);
      toast.error(error.message || "Failed to create workflow from template");
    },
  });
};

export const useCreateAITemplateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { prompt: string }) => {
      const response = await api("/chat/ai/template-workflows", {
        method: "POST",
        body: data,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                packageIds: z.array(z.string().uuid()),
                knowledgeBaseIds: z.array(z.string().uuid()).optional(),
                prompt: z.string(),
              })
            ),
            isPublic: z.boolean(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueries.templateWorkflows() });
      toast.success("AI template workflow created successfully");
    },
    onError: (error) => {
      console.error("Failed to create AI template workflow:", error);
      toast.error(error.message || "Failed to create AI template workflow");
    },
  });
};

export const useUpdateAITemplateWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      templateId: string;
      prompt: string;
    }) => {
      const { templateId, ...updateData } = data;
      const response = await api(`/chat/ai/template-workflows/${templateId}`, {
        method: "PATCH",
        body: updateData,
        schema: responseSchema(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            workflow: z.array(
              z.object({
                name: z.string(),
                packageIds: z.array(z.string().uuid()),
                knowledgeBaseIds: z.array(z.string().uuid()).optional(),
                prompt: z.string(),
              })
            ),
            isPublic: z.boolean(),
            ownerId: z.string().uuid(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatQueries.templateWorkflows() });
      queryClient.invalidateQueries({
        queryKey: chatQueries.templateWorkflow(variables.templateId),
      });
      toast.success("AI template workflow updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update AI template workflow:", error);
      toast.error(error.message || "Failed to update AI template workflow");
    },
  });
};

export const useCreateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      imageUrl?: string;
    }) => {
      const response = await api("/users/profiles", {
        method: "POST",
        body: data,
        schema: responseSchema(z.object({
          id: z.string().uuid(),
          userId: z.string().uuid(),
          name: z.string(),
          imageUrl: z.string().nullable(),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        })),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.profiles() });
      toast.success("Profile created successfully");
    },
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      name?: string;
      imageUrl?: string;
    }) => {
      const { profileId, ...updateData } = data;
      const response = await api(`/users/profiles/${profileId}`, {
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
      queryClient.invalidateQueries({ queryKey: userQueries.profiles() });
      queryClient.invalidateQueries({ queryKey: userQueries.profile(variables.profileId) });
      toast.success("Profile updated successfully");
    },
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const response = await api(`/users/profiles/${profileId}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: (_, profileId) => {
      queryClient.invalidateQueries({ queryKey: userQueries.profiles() });
      queryClient.removeQueries({ queryKey: userQueries.profile(profileId) });
      toast.success("Profile deleted successfully");
    },
  });
};


// DeFi Mutations
export const useGetAssetBalancesMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      userServiceConnectionId: string;
      chainIds?: number[];
      skipCache?: boolean;
    }) => {
      const params: Record<string, string> = {};
      if (data.chainIds) params.chainIds = data.chainIds.join(',');
      if (data.skipCache) params.skipCache = 'true';

      const response = await api(`/hub/defi/balances/${data.userServiceConnectionId}`, {
        params,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
};



export const useGetAssetPricesMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      assets: Array<{
        chainId: number;
        address: string;
      }>;
      skipCache?: boolean;
    }) => {
      const response = await api("/hub/defi/asset-prices", {
        method: "POST",
        body: data,
        schema: responseSchema(z.any()),
      });
      if (response.status === "FAILED") {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
};

// DCR Mutations
export const useRegisterDCRClientMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      client_name: string;
      redirect_uris: string[];
      grant_types?: string[];
      response_types?: string[];
      token_endpoint_auth_method?: string;
      scope?: string;
    }) => {
      const response = await api("/hub/dcr", {
        method: "POST",
        body: data,
        schema: z.object({
          client_id: z.string(),
          client_secret: z.string(),
          client_secret_expires_at: z.number(),
          client_name: z.string(),
          redirect_uris: z.array(z.string()),
          grant_types: z.array(z.string()),
          response_types: z.array(z.string()),
          token_endpoint_auth_method: z.string(),
          scope: z.string(),
          registration_client_uri: z.string(),
          registration_access_token: z.string(),
          client_id_issued_at: z.number(),
        }),
      });
      return response;
    },
  });
};


// export const useWorkflowStreamMutation = () => {
//   return useMutation({
//     mutationFn: async (executionId: string) => {
//       // This would typically be handled with Server-Sent Events or WebSocket
//       // For now, we'll use a simple GET request
//       const response = await api(`/chat/workflow/stream/${executionId}`, {
//         method: "GET",
//         schema: responseSchema(z.any()),
//       });
//       if (response.status === "FAILED") {
//         throw new Error(response.error);
//       }
//       return response.data;
//     },
//   });
// };

