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
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
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
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
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
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() });
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
              redirectUris: z.array(z.string().url()),
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
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({
        queryKey: hubQueries.oauthClient(clientId),
      });
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
    },
  });
};

