import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import {
  knowledgeBaseSchema,
  packageListSchema,
  packageSchema,
  popularPackageSchema,
  responseSchema,
  userSchema,
} from "@/types";
import { api } from "./api";
import { isAuthenticated } from "./auth-optimized";
import { ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";



export const userQueries = {
  all: () => ["users"] as const,
  me: () => [...userQueries.all(), "me"] as const,

  meOptions: (enabled: boolean = true) =>
    queryOptions({
      queryKey: userQueries.me(),
      queryFn: async () => {
        const response = await api("/users", {
          schema: responseSchema(userSchema),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
      enabled: enabled && isAuthenticated(),
    }),

  authProviders: () => [...userQueries.all(), "auth-providers"] as const,

  authProvidersOptions: (enabled: boolean = true) =>
    queryOptions({
      queryKey: userQueries.authProviders(),
      queryFn: async () => {
        const response = await api("/users/auth", {
          schema: responseSchema(
            z.array(
              z.object({
                provider: z.string(),
                providerId: z.string(),
                email: z.string().optional(),
                name: z.string().optional(),
                connectedAt: z.string().datetime(),
              })
            )
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
      enabled: enabled && isAuthenticated(),
    }),
};

export const packageQueries = {
  all: () => ["packages"] as const,
  lists: () => [...packageQueries.all(), "list"] as const,
  list: (filters: {
    publisherId?: string;
    name?: string;
    search?: string;
    type?: string;
    isFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
    createdAfter?: string;
    createdBefore?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => [...packageQueries.lists(), filters] as const,
  details: () => [...packageQueries.all(), "detail"] as const,
  detail: (id: string) => [...packageQueries.details(), id] as const,
  userInstalled: () => [...packageQueries.all(), "user-installed"] as const,
  userDeployments: () => [...packageQueries.all(), "user-deployments"] as const,
  deployment: (id: string) =>
    [...packageQueries.userDeployments(), id] as const,
  deploymentAuth: (id: string) =>
    [...packageQueries.deployment(id), "auth"] as const,
  githubRepos: () => [...packageQueries.all(), "github-repos"] as const,
  popular: () => [...packageQueries.all(), "popular"] as const,
  authScopes: (packageId: string) => [...packageQueries.all(), "auth-scopes", packageId] as const,

  listOptions: (filters: {
    publisherId?: string;
    name?: string;
    search?: string;
    type?: string;
    isFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
    createdAfter?: string;
    createdBefore?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) =>
    queryOptions({
      queryKey: packageQueries.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.publisherId) params.set("publisherId", filters.publisherId);
        if (filters.name) params.set("name", filters.name);
        if (filters.search) params.set("search", filters.search);
        if (filters.type) params.set("type", filters.type);
        if (filters.isFree !== undefined) params.set("isFree", String(filters.isFree));
        if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
        if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
        if (filters.createdAfter) params.set("createdAfter", filters.createdAfter);
        if (filters.createdBefore) params.set("createdBefore", filters.createdBefore);
        if (filters.sortBy) params.set("sortBy", filters.sortBy);
        if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
        params.set("page", String(filters.page || 1));
        params.set("limit", String(filters.limit || 10));

        const response = await api(`/packages?${params}`, {
          schema: z.object({
            status: z.literal("SUCCESS"),
            data: z.array(packageListSchema),
            pagination: z.object({
              total: z.number(),
              totalPages: z.number(),
              page: z.number(),
              limit: z.number(),
            }),
            filters: z.object({
              page: z.number(),
              limit: z.number(),
              sortBy: z.string().optional(),
              sortOrder: z.string().optional(),
              search: z.string().optional(),
              name: z.string().optional(),
              publisherId: z.string().optional(),
            }).optional(),
          }),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }

        return response;
      },
      staleTime: 2 * 60 * 1000,
    }),

  detailOptions: (id: string) =>
    queryOptions({
      queryKey: packageQueries.detail(id),
      queryFn: async () => {
        const response = await api(`/packages/${id}`, {
          schema: responseSchema(packageSchema),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  userInstalledOptions: (enabled: boolean = true) =>
    queryOptions({
      queryKey: packageQueries.userInstalled(),
      queryFn: async () => {
        const response = await api("/packages/packages/user", {
          schema: responseSchema(
            z.array(
              z.object({
                userMcpId: z.string().uuid(),
                userId: z.string().uuid(),
                packageId: z.string().uuid(),
                version: z.string(),
                installedAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                package: packageSchema,
              })
            )
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 1 * 60 * 1000,
      enabled: enabled && isAuthenticated(),
    }),

  userDeploymentsOptions: (enabled: boolean = true) =>
    queryOptions({
      queryKey: packageQueries.userDeployments(),
      queryFn: async () => {
        const response = await api("/packages/packages/user/deployments", {
          schema: responseSchema(
            z.array(
              z.object({
                deployment: z.object({
                  deploymentId: z.string().uuid(),
                  userMcpId: z.string().uuid(),
                  url: z.string(),
                  scopes: z.array(z.string()),
                  status: z.enum(["active", "inactive", "pending"]),
                  createdAt: z.string().datetime(),
                  updatedAt: z.string().datetime(),
                }),
                userMcpId: z.string().uuid(),
                package: packageSchema,
              })
            )
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data; // Not response.data.data
      },
      staleTime: 1 * 60 * 1000,
      enabled: enabled && isAuthenticated(),
    }),

  popularOptions: () =>
    queryOptions({
      queryKey: packageQueries.popular(),
      queryFn: async () => {
        const response = await api("/packages/popular", {
          schema: z.object({
            status: z.literal("SUCCESS"),
            data: z.array(popularPackageSchema),
            pagination: z.object({
              total: z.number(),
              totalPages: z.number(),
              page: z.number(),
              limit: z.number(),
            }),
          }),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response; // Return full response to match listOptions structure
      },
      staleTime: 10 * 60 * 1000,
    }),

  deploymentOptions: (id: string) =>
    queryOptions({
      queryKey: packageQueries.deployment(id),
      queryFn: async () => {
        const response = await api(`/packages/package/deployments/${id}`, {
          schema: responseSchema(
            z.object({
              id: z.string().uuid(),
              userId: z.string().uuid(),
              clientId: z.string().uuid(),
              status: z.enum(["active", "inactive", "pending"]),
              services: z.array(z.string()),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
              connections: z.array(
                z.object({
                  connectionId: z.string().uuid(),
                  serviceClientName: z.string(),
                  serviceClientType: z.enum([
                    "oauth",
                    "secret_sharing",
                    "embedded_wallet",
                  ]),
                  supportedServices: z.array(z.string()),
                  scopes: z.array(z.string()),
                }),
              ),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
    }),

  deploymentAuthOptions: (id: string) =>
    queryOptions({
      queryKey: packageQueries.deploymentAuth(id),
      queryFn: async () => {
        const response = await api(
          `/packages/packages/user/deployments/${id}/auth`,
          {
            schema: responseSchema(
              z.array(
                z.object({
                  connection: z.object({
                    connectionId: z.string().uuid(),
                    scopes: z.array(z.string()),
                  }),
                  serviceClient: z.object({
                    serviceClientId: z.string().uuid(),
                    serviceClientName: z.string(),
                    serviceClientType: z.enum([
                      "oauth",
                      "secret_sharing",
                      "embedded_wallet",
                    ]),
                    supportedScopes: z.array(z.string()),
                    supportedServices: z.array(z.string()),
                  }),
                }),
              ),
            ),
          },
        );
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
    }),

  githubReposOptions: () =>
    queryOptions({
      queryKey: packageQueries.githubRepos(),
      queryFn: async () => {
        const response = await api("/packages/github/available-packages", {
          schema: responseSchema(
            z.array(
              z.object({
                id: z.number(),
                name: z.string(),
                full_name: z.string(),
                description: z.string().nullable(),
                html_url: z.string().url(),
                clone_url: z.string().url(),
                language: z.string().nullable(),
                stargazers_count: z.number(),
                forks_count: z.number(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  authScopesOptions: (packageId: string) =>
    queryOptions({
      queryKey: packageQueries.authScopes(packageId),
      queryFn: async () => {
        const response = await api(`/packages/${packageId}/auth-scopes`, {
          schema: responseSchema(z.array(z.string())),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  weeklyDownloads: (packageId: string, params: {
    startDate: string;
    endDate: string;
  }) => [...packageQueries.all(), "weekly-downloads", packageId, params],

  actions: (packageId?: string) => [...packageQueries.all(), "actions", packageId],

  weeklyDownloadsOptions: (packageId: string, params: {
    startDate: string;
    endDate: string;
  }) => queryOptions({
    queryKey: packageQueries.weeklyDownloads(packageId, params),
    queryFn: async () => {
      const response = await api(`/packages/${packageId}/weekly-downloads`, {
        params,
        schema: responseSchema(z.any())
      });
      return response.data;
    }
  }),

  actionsOptions: (packageId?: string, enabled: boolean = true) => queryOptions({
    queryKey: packageQueries.actions(packageId),
    queryFn: async () => {
      const params = packageId ? { packageId } : {};
      if (!isAuthenticated()) {
        return [];
      }
      const response = await api("/packages/packages/user/actions", {
        // @ts-ignore
        params,
        schema: responseSchema(z.any())
      });
      return response.data;
    },
    enabled: enabled && isAuthenticated(),
  }),

  mcpToolsOptions: (serverUrl: string) => queryOptions({
    queryKey: [...packageQueries.all(), "mcp-tools", serverUrl],
    queryFn: async () => {

      if (!serverUrl || serverUrl.trim() === '') {
        return { tools: [] };
      }

      try {
        const response = await api('/packages/mcp-proxy', {
          method: 'POST',
          body: {
            url: serverUrl
          }
        });

        // @ts-ignore
        const tools = response?.tools || [];

        return { tools };
      } catch (error) {
        return { tools: [] };
      }
    },
    staleTime: 5 * 60 * 1000,
  })
};

export const creditQueries = {
  all: () => ["credits"] as const,
  balance: () => [...creditQueries.all(), "balance"] as const,
  transactions: () => [...creditQueries.all(), "transactions"] as const,
  transfers: () => [...creditQueries.all(), "transfers"] as const,
  deposits: () => [...creditQueries.all(), "deposits"] as const,
  depositMethods: () => [...creditQueries.all(), "deposit-methods"] as const,
  cashouts: () => [...creditQueries.all(), "cashouts"] as const,
  earnings: () => [...creditQueries.all(), "earnings"] as const,
  spending: () => [...creditQueries.all(), "spending"] as const,

  balanceOptions: () =>
    queryOptions({
      queryKey: creditQueries.balance(),
      queryFn: async () => {
        const response = await api("/credits/balance", {
          schema: responseSchema(
            z.object({
              accountId: z.string().uuid(),
              totalCredits: z.string(),
              totalDeposited: z.string(),
              totalSpent: z.string(),
              totalEarned: z.string(),
              totalCashedOut: z.string(),
              isActive: z.boolean(),
              recentTransactions: z.array(z.any()),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 30 * 1000, // 30 seconds - frequently updated
    }),

  transactionsOptions: (params?: {
    type?: string;
    limit?: number;
    offset?: number;
  }) =>
    queryOptions({
      queryKey: [...creditQueries.transactions(), params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.set("type", params.type);
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));

        const response = await api(`/credits/transactions?${searchParams}`, {
          schema: responseSchema(
            z.array(
              z.object({
                transactionId: z.string().uuid(),
                accountId: z.string().uuid(),
                type: z.enum([
                  "deposit",
                  "spend",
                  "earn",
                  "cashout",
                  "refund",
                  "platform_fee",
                  "adjustment",
                ]),
                amount: z.string(),
                description: z.string(),
                transferId: z.string().uuid().nullable(),
                externalDepositId: z.string().nullable(),
                cashoutId: z.string().uuid().nullable(),
                balanceAfter: z.string(),
                metadata: z.record(z.any()),
                createdAt: z.string().datetime(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 30 * 1000,
    }),

  transfersOptions: (params?: { limit?: number; offset?: number }) =>
    queryOptions({
      queryKey: [...creditQueries.transfers(), params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));

        const response = await api(`/credits/transfers?${searchParams}`, {
          schema: responseSchema(
            z.array(
              z.object({
                transfer: z.object({
                  transferId: z.string().uuid(),
                  fromAccountId: z.string().uuid().nullable(),
                  toAccountId: z.string().uuid().nullable(),
                  amount: z.string(),
                  platformFee: z.string(),
                  netAmount: z.string(),
                  packageId: z.string().uuid().nullable(),
                  deploymentId: z.string().uuid().nullable(),
                  actionType: z.string().nullable(),
                  description: z.string(),
                  metadata: z.record(z.any()),
                  createdAt: z.string().datetime(),
                }),
                package: packageSchema.nullable(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 1 * 60 * 1000,
    }),

  depositsOptions: () =>
    queryOptions({
      queryKey: creditQueries.deposits(),
      queryFn: async () => {
        const response = await api("/credits/deposits", {
          schema: responseSchema(
            z.object({
              deposits: z.array(z.any()),
              summary: z.object({
                totalDeposited: z.string(),
                helio: z.string(),
                stripe: z.string(),
                other: z.string(),
              }),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 1 * 60 * 1000,
    }),

  depositMethodsOptions: () =>
    queryOptions({
      queryKey: creditQueries.depositMethods(),
      queryFn: async () => {
        const response = await api("/credits/deposit/methods", {
          schema: responseSchema(
            z.object({
              web3: z.object({
                enabled: z.boolean(),
                name: z.string(),
                type: z.literal("web3"),
                fees: z.object({
                  platform: z.string(),
                  network: z.string(),
                }),
                supportedCurrencies: z.array(z.string()),
                supportedChains: z.array(z.string()),
              }),
              traditional: z.object({
                enabled: z.boolean(),
                name: z.string(),
                type: z.literal("traditional"),
                fees: z.object({
                  platform: z.string(),
                  currency_conversion: z.string(),
                }),
                supportedCurrencies: z.array(z.string()),
                paymentMethods: z.array(z.string()),
              }),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    }),

  cashoutsOptions: (params?: { limit?: number; offset?: number }) =>
    queryOptions({
      queryKey: [...creditQueries.cashouts(), params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));

        const response = await api(`/credits/cashouts?${searchParams}`, {
          schema: responseSchema(
            z.array(
              z.object({
                cashoutId: z.string().uuid(),
                accountId: z.string().uuid(),
                creditAmount: z.string(),
                processingFee: z.string(),
                netAmount: z.string(),
                payoutMethod: z.enum(["crypto", "bank", "paypal"]),
                payoutDetails: z.record(z.any()),
                externalTransactionId: z.string().nullable(),
                status: z.enum([
                  "pending",
                  "processing",
                  "completed",
                  "failed",
                  "cancelled",
                ]),
                statusMessage: z.string().nullable(),
                requestedAt: z.string().datetime(),
                processedAt: z.string().datetime().nullable(),
                completedAt: z.string().datetime().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 1 * 60 * 1000,
    }),

  earningsOptions: () =>
    queryOptions({
      queryKey: creditQueries.earnings(),
      queryFn: async () => {
        const response = await api("/credits/earnings", {
          schema: responseSchema(
            z.object({
              currentBalance: z.string(),
              totalEarned: z.string(),
              totalCashedOut: z.string(),
              earningsByPackage: z.array(
                z.object({
                  totalEarned: z.string(),
                  totalTransfers: z.string(),
                  totalPlatformFees: z.string(),
                  packageId: z.string(),
                  packageName: z.string(),
                }),
              ),
              recentCashouts: z.array(z.any()),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 1 * 60 * 1000,
    }),

  spendingOptions: () =>
    queryOptions({
      queryKey: creditQueries.spending(),
      queryFn: async () => {
        const response = await api("/credits/spending", {
          schema: responseSchema(
            z.object({
              currentBalance: z.string(),
              totalDeposited: z.string(),
              totalSpent: z.string(),
              spendingByPackage: z.array(
                z.object({
                  packageId: z.string(),
                  packageName: z.string(),
                  totalSpent: z.string(),
                  paymentMethod: z.string(),
                  transactionCount: z.number(),
                }),
              ),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 1 * 60 * 1000,
    }),
};

export const knowledgeQueries = {
  all: (filters?: { search?: string; page?: number; limit?: number }) => ["knowledge", ...(filters ? Object.entries(filters) : [])] as const,
  bases: (filters?: { search?: string; page?: number; limit?: number }) => [...knowledgeQueries.all(), "bases", ...(filters ? Object.entries(filters) : [])] as const,
  base: (id: string) => [...knowledgeQueries.bases(), id] as const,
  my: (filters?: { search?: string; page?: number; limit?: number }) => [...knowledgeQueries.all(), "my", ...(filters ? Object.entries(filters) : [])] as const,
  sources: (baseId: string) =>
    [...knowledgeQueries.base(baseId), "sources"] as const,
  units: (baseId: string) =>
    [...knowledgeQueries.base(baseId), "units"] as const,

  basesOptions: (filters?: { search?: string; page?: number; limit?: number }) =>
    queryOptions({
      queryKey: knowledgeQueries.bases(filters),
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (filters?.search) searchParams.set("search", filters.search);
        if (filters?.page) searchParams.set("page", String(filters.page));
        if (filters?.limit) searchParams.set("limit", String(filters.limit));

        const response = await api(`/knowledge-base?${searchParams}`, {
          schema: z.object({
            status: z.literal("SUCCESS"),
            data: z.array(knowledgeBaseSchema.extend({
              user: z.object({
                userId: z.string().uuid(),
                name: z.string(),
                email: z.string(),
                imageUrl: z.string().nullable(),
              }),
            })),
            pagination: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response;
      },
      staleTime: 2 * 60 * 1000,
    }),

  baseOptions: (id: string) =>
    queryOptions({
      queryKey: knowledgeQueries.base(id),
      queryFn: async () => {
        const response = await api(`/knowledge-base/${id}`, {
          schema: responseSchema(knowledgeBaseSchema),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  myOptions: (filters?: { search?: string; page?: number; limit?: number }) =>
    queryOptions({
      queryKey: [...knowledgeQueries.my(filters)],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (filters?.search) searchParams.set("search", filters.search);
        if (filters?.page) searchParams.set("page", String(filters.page));
        if (filters?.limit) searchParams.set("limit", String(filters.limit));

        const response = await api(`/knowledge-base/my?${searchParams}`, {
          schema: z.object({
            status: z.literal("SUCCESS"),
            data: z.array(knowledgeBaseSchema.extend({
              user: z.object({
                userId: z.string().uuid(),
                name: z.string(),
                email: z.string(),
                imageUrl: z.string().nullable(),
              }),
            })),
            pagination: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response;
      },
      staleTime: 2 * 60 * 1000,
    }),

  sourcesOptions: (baseId: string) =>
    queryOptions({
      queryKey: knowledgeQueries.sources(baseId),
      queryFn: async () => {
        const response = await api(`/knowledge-base/${baseId}/sources`, {
          schema: responseSchema(
            z.array(
              z.object({
                sourceId: z.string().uuid(),
                knowledgeBaseId: z.string().uuid(),
                sourceType: z.enum([
                  "image",
                  "text",
                  "youtube_url",
                  "url",
                  "file",
                ]),
                source: z.string(),
                processingStatus: z.enum([
                  "pending",
                  "processing",
                  "completed",
                  "failed",
                ]),
                processingErrorMessage: z.string().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 30 * 1000, // 30 seconds - processing status changes frequently
    }),

  unitsOptions: (baseId: string) =>
    queryOptions({
      queryKey: knowledgeQueries.units(baseId),
      queryFn: async () => {
        const response = await api(`/knowledge-base/${baseId}/units`, {
          schema: responseSchema(
            z.array(
              z.object({
                unitId: z.string().uuid(),
                knowledgeBaseId: z.string().uuid(),
                sourceId: z.string().uuid(),
                name: z.string(),
                content: z.string(),
                tags: z.array(z.string()),
                type: z.string().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 2 * 60 * 1000,
    }),

  myBases: (params?: { limit?: number; page?: number }) => [...knowledgeQueries.all(), "my-bases", params] as const,

  myBasesOptions: (params?: { limit?: number; page?: number }) =>
    queryOptions({
      queryKey: knowledgeQueries.myBases(params),
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.page) searchParams.set("page", String(params.page));

        const response = await api(`/knowledge-base/my?${searchParams}`, {
          schema: responseSchema(
            z.object({
              data: z.array(knowledgeBaseSchema),
              pagination: z.object({
                total: z.number(),
                totalPages: z.number(),
                page: z.number(),
                limit: z.number(),
              }),
            })
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 2 * 60 * 1000,
    }),
};

export const hubQueries = {
  all: () => ["hub"] as const,
  auth: () => [...hubQueries.all(), "auth"] as const,
  userAuth: () => [...hubQueries.auth(), "user"] as const,
  userAuthConnection: (id: string) => [...hubQueries.userAuth(), id] as const,
  oauthClients: () => [...hubQueries.all(), "oauth-clients"] as const,
  oauthClient: (id: string) => [...hubQueries.oauthClients(), id] as const,

  authMethodsOptions: () =>
    queryOptions({
      queryKey: hubQueries.auth(),
      queryFn: async () => {
        const response = await api("/hub/auth", {
          schema: responseSchema(
            z.array(
              z.object({
                clientId: z.string().uuid(),
                name: z.string(),
                description: z.string(),
                type: z.enum(["oauth", "secret_sharing", "embedded_wallet"]),
                supportedScopes: z.array(z.string()),
                scopeDefinitions: z.record(z.string()),
                supportedServices: z.array(z.string()),
                metadata: z.record(z.any()),
                embedding: z.any().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                iconUrl: z.string().nullable(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    }),

  userAuthOptions: (enabled: boolean = true) =>
    queryOptions({
      queryKey: hubQueries.userAuth(),
      queryFn: async () => {
        const response = await api("/hub/auth/user", {
          schema: responseSchema(
            z.array(
              z.object({
                user_service_connections: z.object({
                  id: z.string().uuid(),
                  userId: z.string().uuid(),
                  clientId: z.string().uuid(),
                  uniqueId: z.string(),
                  credentials: z.object({
                    hasCredentials: z.boolean(),
                    credentialType: z.string(),
                  }),
                  metadata: z.object({
                    user: z
                      .object({
                        id: z.string().optional(),
                        name: z.string().optional(),
                        email: z.string().optional(),
                        uniqueId: z.string(),
                        avatar_url: z.string().optional(),
                        picture: z.string().optional(),
                        sub: z.string().optional(),
                        email_verified: z.boolean().optional(),
                      })
                      .optional(),
                  }),
                  policy: z.record(z.any()),
                  scopes: z.array(z.string()),
                  name: z.string().nullable(),
                  createdAt: z.string().datetime(),
                  updatedAt: z.string().datetime(),
                }),
                service_clients: z.object({
                  clientId: z.string().uuid(),
                  name: z.string(),
                  description: z.string(),
                  type: z.enum(["oauth", "secret_sharing", "embedded_wallet"]),
                  supportedScopes: z.array(z.string()),
                  scopeDefinitions: z.record(z.string()),
                  supportedServices: z.array(z.string()),
                  metadata: z.record(z.any()),
                  embedding: z.any().nullable(),
                  createdAt: z.string().datetime(),
                  updatedAt: z.string().datetime(),
                  iconUrl: z.string().nullable(),
                }),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 2 * 60 * 1000,
      enabled: enabled && isAuthenticated(),
    }),

  userAuthConnectionOptions: (id: string, enabled: boolean = true) =>
    queryOptions({
      queryKey: hubQueries.userAuthConnection(id),
      queryFn: async () => {
        const response = await api(`/hub/auth/user/${id}`, {
          schema: responseSchema(
            z.object({
              id: z.string().uuid(),
              userId: z.string().uuid(),
              clientId: z.string().uuid(),
              uniqueId: z.string(),
              credentials: z.object({
                hasCredentials: z.boolean(),
                credentialType: z.string(),
              }),
              metadata: z.object({
                user: z
                  .object({
                    id: z.string().optional(),
                    name: z.string().optional(),
                    email: z.string().optional(),
                    uniqueId: z.string(),
                    avatar_url: z.string().optional(),
                    picture: z.string().optional(),
                    sub: z.string().optional(),
                    email_verified: z.boolean().optional(),
                  })
                  .optional(),
              }),
              policy: z.record(z.any()),
              scopes: z.array(z.string()),
              name: z.string().nullable(),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      enabled: enabled && isAuthenticated(),
    }),

  oauthClientsOptions: () =>
    queryOptions({
      queryKey: hubQueries.oauthClients(),
      queryFn: async () => {
        const response = await api("/hub/oauth-clients", {
          schema: responseSchema(
            z.array(
              z.object({
                clientId: z.string().uuid(),
                developerId: z.string().uuid(),
                name: z.string(),
                redirectUris: z.array(z.string().url()),
                metadata: z.record(z.any()),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
              }),
            ),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  oauthClientOptions: (id: string) =>
    queryOptions({
      queryKey: hubQueries.oauthClient(id),
      queryFn: async () => {
        const response = await api(`/hub/oauth-clients/${id}`, {
          schema: responseSchema(
            z.object({
              clientId: z.string().uuid(),
              developerId: z.string().uuid(),
              name: z.string(),
              redirectUris: z.array(z.string().url()),
              metadata: z.record(z.any()),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    }),


  popularAuth: () => [...hubQueries.all(), "popular-auth"] as const,

  popularAuthOptions: () =>
    queryOptions({
      queryKey: hubQueries.popularAuth(),
      queryFn: async () => {
        const response = await api("/hub/auth/popular", {
          schema: responseSchema(z.array(z.any())),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      staleTime: 10 * 60 * 1000,
    }),

  userAuthConnectionUnencryptedOptions: (id: string, enabled: boolean = false) =>
    queryOptions({
      queryKey: [...hubQueries.userAuthConnection(id), "unencrypted"] as const,
      queryFn: async () => {
        const response = await api(`/hub/auth/user/${id}`, {
          schema: responseSchema(
            z.object({
              id: z.string().uuid(),
              userId: z.string().uuid(),
              clientId: z.string().uuid(),
              uniqueId: z.string(),
              credentials: z.record(z.any()), // Unencrypted credentials
              metadata: z.record(z.any()),
              scopes: z.array(z.string()),
              name: z.string().nullable(),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
          ),
        });
        if (response.status === "FAILED") {
          throw new Error(response.error);
        }
        return response.data;
      },
      enabled: enabled && isAuthenticated(), // Only fetch when explicitly requested AND authenticated
    }),
};
