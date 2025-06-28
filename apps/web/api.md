## Installation

```bash
# Core dependencies
bun install @tanstack/react-router @tanstack/react-query @tanstack/router-devtools @tanstack/react-query-devtools
bun install up-fetch zod
```

## 1. API Client Setup with up-fetch

```typescript
// src/lib/api.ts
import { up } from 'up-fetch'
import { z } from 'zod'

// Base API client
export const api = up(fetch, () => ({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  onRequest: (options) => {
    // Add auth token if available
    const token = localStorage.getItem('access_token')
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  },
  onError: (error) => {
    if (error.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
  },
}))

// Auth API client (for login/register endpoints) -- Note - P.S. have to see how auth is handled in the figma
export const authApi = up(fetch, () => ({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
}))

// Response schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'developer', 'viewer', 'super_admin']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
})

export const packageSchema = z.object({
  packageId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  publisherId: z.string().uuid().nullable(),
  latestVersion: z.string().nullable(),
  metadata: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const creditAccountSchema = z.object({
  accountId: z.string().uuid(),
  totalCredits: z.string(),
  totalDeposited: z.string(),
  totalSpent: z.string(),
  totalEarned: z.string(),
  totalCashedOut: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const knowledgeBaseSchema = z.object({
  knowledgeBaseId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  userId: z.string().uuid(),
  isPublic: z.boolean(),
  publicMetadata: z.object({
    price: z.number(),
    downloads: z.number(),
    rating: z.number(),
  }),
  coverImageUrl: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Response wrappers
const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    status: z.literal('SUCCESS'),
    data: dataSchema,
  })

const errorResponseSchema = z.object({
  status: z.literal('FAILED'),
  error: z.string(),
})

export const responseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.discriminatedUnion('status', [
    successResponseSchema(dataSchema),
    errorResponseSchema,
  ])

export type User = z.infer<typeof userSchema>
export type Package = z.infer<typeof packageSchema>
export type CreditAccount = z.infer<typeof creditAccountSchema>
export type KnowledgeBase = z.infer<typeof knowledgeBaseSchema>

// ===== UTILITY QUERIES =====
export const utilityQueries = {
  all: () => ['utility'] as const,
  health: () => [...utilityQueries.all(), 'health'] as const,

  healthOptions: () =>
    queryOptions({
      queryKey: utilityQueries.health(),
      queryFn: async () => {
        const response = await api('/health', {
          schema: z.object({
            status: z.string(),
            timestamp: z.string().datetime(),
            environment: z.string(),
            paymentProviders: z.object({
              helio: z.object({
                enabled: z.boolean(),
                environment: z.string(),
              }),
              stripe: z.object({
                enabled: z.boolean(),
                environment: z.string(),
              }),
            }),
            features: z.object({
              web3Deposits: z.boolean(),
              traditionalDeposits: z.boolean(),
              cryptoPayouts: z.boolean(),
              bankPayouts: z.boolean(),
              paypalPayouts: z.boolean(),
            }),
          }),
        })
        return response
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false, // Don't retry health checks
    }),
}
```

## 2. Query Options and API Functions

```typescript
// src/lib/queries.ts
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query'
import { api, authApi, responseSchema, userSchema, packageSchema, creditAccountSchema, knowledgeBaseSchema } from './api'
import { z } from 'zod'

// ===== USER QUERIES =====
export const userQueries = {
  all: () => ['users'] as const,
  me: () => [...userQueries.all(), 'me'] as const,
  
  meOptions: () =>
    queryOptions({
      queryKey: userQueries.me(),
      queryFn: async () => {
        const response = await api('/users', {
          schema: responseSchema(userSchema),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
}

// ===== PACKAGE QUERIES =====
export const packageQueries = {
  all: () => ['packages'] as const,
  lists: () => [...packageQueries.all(), 'list'] as const,
  list: (filters: { publisherId?: string; name?: string; page?: number; limit?: number }) =>
    [...packageQueries.lists(), filters] as const,
  details: () => [...packageQueries.all(), 'detail'] as const,
  detail: (id: string) => [...packageQueries.details(), id] as const,
  userInstalled: () => [...packageQueries.all(), 'user-installed'] as const,
  userDeployments: () => [...packageQueries.all(), 'user-deployments'] as const,
  deployment: (id: string) => [...packageQueries.userDeployments(), id] as const,
  deploymentAuth: (id: string) => [...packageQueries.deployment(id), 'auth'] as const,
  githubRepos: () => [...packageQueries.all(), 'github-repos'] as const,

  listOptions: (filters: { publisherId?: string; name?: string; page?: number; limit?: number }) =>
    queryOptions({
      queryKey: packageQueries.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams()
        if (filters.publisherId) params.set('publisherId', filters.publisherId)
        if (filters.name) params.set('name', filters.name)
        params.set('pagination[page]', String(filters.page || 1))
        params.set('pagination[limit]', String(filters.limit || 10))

        const response = await api(`/packages?${params}`, {
          schema: responseSchema(z.object({
            data: z.array(packageSchema),
            pagination: z.object({
              total: z.number(),
              totalPages: z.number(),
              page: z.number(),
              limit: z.number(),
            }),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),

  detailOptions: (id: string) =>
    queryOptions({
      queryKey: packageQueries.detail(id),
      queryFn: async () => {
        const response = await api(`/packages/${id}`, {
          schema: responseSchema(packageSchema),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    }),

  userInstalledOptions: () =>
    queryOptions({
      queryKey: packageQueries.userInstalled(),
      queryFn: async () => {
        const response = await api('/packages/packages/user', {
          schema: responseSchema(z.array(z.object({
            userMcpId: z.string().uuid(),
            userId: z.string().uuid(),
            packageId: z.string().uuid(),
            version: z.string(),
            installedAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
            package: packageSchema,
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),

  userDeploymentsOptions: () =>
    queryOptions({
      queryKey: packageQueries.userDeployments(),
      queryFn: async () => {
        const response = await api('/packages/packages/user/deployments', {
          schema: responseSchema(z.array(z.object({
            deployment: z.object({
              deploymentId: z.string().uuid(),
              userMcpId: z.string().uuid(),
              url: z.string().url(),
              scopes: z.array(z.string()),
              status: z.enum(['active', 'inactive', 'pending']),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
            userMcpId: z.string().uuid(),
            package: packageSchema,
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),

  deploymentOptions: (id: string) =>
    queryOptions({
      queryKey: packageQueries.deployment(id),
      queryFn: async () => {
        const response = await api(`/packages/package/deployments/${id}`, {
          schema: responseSchema(z.object({
            id: z.string().uuid(),
            userId: z.string().uuid(),
            clientId: z.string().uuid(),
            status: z.enum(['active', 'inactive', 'pending']),
            services: z.array(z.string()),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
            connections: z.array(z.object({
              connectionId: z.string().uuid(),
              serviceClientName: z.string(),
              serviceClientType: z.enum(['oauth', 'secret_sharing', 'embedded_wallet']),
              supportedServices: z.array(z.string()),
              scopes: z.array(z.string()),
            })),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
    }),

  deploymentAuthOptions: (id: string) =>
    queryOptions({
      queryKey: packageQueries.deploymentAuth(id),
      queryFn: async () => {
        const response = await api(`/packages/packages/user/deployments/${id}/auth`, {
          schema: responseSchema(z.array(z.object({
            connection: z.object({
              connectionId: z.string().uuid(),
              scopes: z.array(z.string()),
            }),
            serviceClient: z.object({
              serviceClientId: z.string().uuid(),
              serviceClientName: z.string(),
              serviceClientType: z.enum(['oauth', 'secret_sharing', 'embedded_wallet']),
              supportedScopes: z.array(z.string()),
              supportedServices: z.array(z.string()),
            }),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
    }),

  githubReposOptions: () =>
    queryOptions({
      queryKey: packageQueries.githubRepos(),
      queryFn: async () => {
        const response = await api('/packages/github/available-packages', {
          schema: responseSchema(z.array(z.object({
            id: z.number(),
            name: z.string(),
            full_name: z.string(),
            description: z.string().nullable(),
            html_url: z.string().url(),
            clone_url: z.string().url(),
            language: z.string().nullable(),
            stargazers_count: z.number(),
            forks_count: z.number(),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    }),
}

// ===== CREDIT QUERIES =====
export const creditQueries = {
  all: () => ['credits'] as const,
  balance: () => [...creditQueries.all(), 'balance'] as const,
  transactions: () => [...creditQueries.all(), 'transactions'] as const,
  transfers: () => [...creditQueries.all(), 'transfers'] as const,
  deposits: () => [...creditQueries.all(), 'deposits'] as const,
  depositMethods: () => [...creditQueries.all(), 'deposit-methods'] as const,
  cashouts: () => [...creditQueries.all(), 'cashouts'] as const,
  earnings: () => [...creditQueries.all(), 'earnings'] as const,
  spending: () => [...creditQueries.all(), 'spending'] as const,

  balanceOptions: () =>
    queryOptions({
      queryKey: creditQueries.balance(),
      queryFn: async () => {
        const response = await api('/credits/balance', {
          schema: responseSchema(z.object({
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
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 30 * 1000, // 30 seconds - frequently updated
    }),

  transactionsOptions: (params?: { type?: string; limit?: number; offset?: number }) =>
    queryOptions({
      queryKey: [...creditQueries.transactions(), params],
      queryFn: async () => {
        const searchParams = new URLSearchParams()
        if (params?.type) searchParams.set('type', params.type)
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.offset) searchParams.set('offset', String(params.offset))

        const response = await api(`/credits/transactions?${searchParams}`, {
          schema: responseSchema(z.array(z.object({
            transactionId: z.string().uuid(),
            accountId: z.string().uuid(),
            type: z.enum(['deposit', 'spend', 'earn', 'cashout', 'refund', 'platform_fee', 'adjustment']),
            amount: z.string(),
            description: z.string(),
            transferId: z.string().uuid().nullable(),
            externalDepositId: z.string().nullable(),
            cashoutId: z.string().uuid().nullable(),
            balanceAfter: z.string(),
            metadata: z.record(z.any()),
            createdAt: z.string().datetime(),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 30 * 1000,
    }),

  transfersOptions: (params?: { limit?: number; offset?: number }) =>
    queryOptions({
      queryKey: [...creditQueries.transfers(), params],
      queryFn: async () => {
        const searchParams = new URLSearchParams()
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.offset) searchParams.set('offset', String(params.offset))

        const response = await api(`/credits/transfers?${searchParams}`, {
          schema: responseSchema(z.array(z.object({
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
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),

  depositsOptions: () =>
    queryOptions({
      queryKey: creditQueries.deposits(),
      queryFn: async () => {
        const response = await api('/credits/deposits', {
          schema: responseSchema(z.object({
            deposits: z.array(z.any()),
            summary: z.object({
              totalDeposited: z.string(),
              helio: z.string(),
              stripe: z.string(),
              other: z.string(),
            }),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),

  depositMethodsOptions: () =>
    queryOptions({
      queryKey: creditQueries.depositMethods(),
      queryFn: async () => {
        const response = await api('/credits/deposit/methods', {
          schema: responseSchema(z.object({
            web3: z.object({
              enabled: z.boolean(),
              name: z.string(),
              type: z.literal('web3'),
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
              type: z.literal('traditional'),
              fees: z.object({
                platform: z.string(),
                currency_conversion: z.string(),
              }),
              supportedCurrencies: z.array(z.string()),
              paymentMethods: z.array(z.string()),
            }),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    }),

  cashoutsOptions: (params?: { limit?: number; offset?: number }) =>
    queryOptions({
      queryKey: [...creditQueries.cashouts(), params],
      queryFn: async () => {
        const searchParams = new URLSearchParams()
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.offset) searchParams.set('offset', String(params.offset))

        const response = await api(`/credits/cashouts?${searchParams}`, {
          schema: responseSchema(z.array(z.object({
            cashoutId: z.string().uuid(),
            accountId: z.string().uuid(),
            creditAmount: z.string(),
            processingFee: z.string(),
            netAmount: z.string(),
            payoutMethod: z.enum(['crypto', 'bank', 'paypal']),
            payoutDetails: z.record(z.any()),
            externalTransactionId: z.string().nullable(),
            status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
            statusMessage: z.string().nullable(),
            requestedAt: z.string().datetime(),
            processedAt: z.string().datetime().nullable(),
            completedAt: z.string().datetime().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),

  earningsOptions: () =>
    queryOptions({
      queryKey: creditQueries.earnings(),
      queryFn: async () => {
        const response = await api('/credits/earnings', {
          schema: responseSchema(z.object({
            currentBalance: z.string(),
            totalEarned: z.string(),
            totalCashedOut: z.string(),
            earningsByPackage: z.array(z.object({
              totalEarned: z.string(),
              totalTransfers: z.string(),
              totalPlatformFees: z.string(),
              packageId: z.string(),
              packageName: z.string(),
            })),
            recentCashouts: z.array(z.any()),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),

  spendingOptions: () =>
    queryOptions({
      queryKey: creditQueries.spending(),
      queryFn: async () => {
        const response = await api('/credits/spending', {
          schema: responseSchema(z.object({
            currentBalance: z.string(),
            totalDeposited: z.string(),
            totalSpent: z.string(),
            spendingByPackage: z.array(z.object({
              packageId: z.string(),
              packageName: z.string(),
              totalSpent: z.string(),
              paymentMethod: z.string(),
              transactionCount: z.number(),
            })),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 1 * 60 * 1000,
    }),
}

// ===== KNOWLEDGE BASE QUERIES =====
export const knowledgeQueries = {
  all: () => ['knowledge'] as const,
  bases: () => [...knowledgeQueries.all(), 'bases'] as const,
  base: (id: string) => [...knowledgeQueries.bases(), id] as const,
  sources: (baseId: string) => [...knowledgeQueries.base(baseId), 'sources'] as const,
  units: (baseId: string) => [...knowledgeQueries.base(baseId), 'units'] as const,

  basesOptions: () =>
    queryOptions({
      queryKey: knowledgeQueries.bases(),
      queryFn: async () => {
        const response = await api('/knowledge-base', {
          schema: responseSchema(z.array(knowledgeBaseSchema)),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 2 * 60 * 1000,
    }),

  baseOptions: (id: string) =>
    queryOptions({
      queryKey: knowledgeQueries.base(id),
      queryFn: async () => {
        const response = await api(`/knowledge-base/${id}`, {
          schema: responseSchema(knowledgeBaseSchema),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    }),

  sourcesOptions: (baseId: string) =>
    queryOptions({
      queryKey: knowledgeQueries.sources(baseId),
      queryFn: async () => {
        const response = await api(`/knowledge-base/${baseId}/sources`, {
          schema: responseSchema(z.array(z.object({
            sourceId: z.string().uuid(),
            knowledgeBaseId: z.string().uuid(),
            sourceType: z.enum(['image', 'text', 'youtube_url', 'url', 'file']),
            source: z.string(),
            processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']),
            processingErrorMessage: z.string().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 30 * 1000, // 30 seconds - processing status changes frequently
    }),

  unitsOptions: (baseId: string) =>
    queryOptions({
      queryKey: knowledgeQueries.units(baseId),
      queryFn: async () => {
        const response = await api(`/knowledge-base/${baseId}/units`, {
          schema: responseSchema(z.array(z.object({
            unitId: z.string().uuid(),
            knowledgeBaseId: z.string().uuid(),
            sourceId: z.string().uuid(),
            name: z.string(),
            content: z.string(),
            tags: z.array(z.string()),
            type: z.string().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 2 * 60 * 1000,
    }),
}

// ===== HUB/AUTH QUERIES =====
export const hubQueries = {
  all: () => ['hub'] as const,
  auth: () => [...hubQueries.all(), 'auth'] as const,
  userAuth: () => [...hubQueries.auth(), 'user'] as const,
  userAuthConnection: (id: string) => [...hubQueries.userAuth(), id] as const,
  oauthClients: () => [...hubQueries.all(), 'oauth-clients'] as const,
  oauthClient: (id: string) => [...hubQueries.oauthClients(), id] as const,

  authMethodsOptions: () =>
    queryOptions({
      queryKey: hubQueries.auth(),
      queryFn: async () => {
        const response = await api('/hub/auth', {
          schema: responseSchema(z.array(z.object({
            clientId: z.string().uuid(),
            name: z.string(),
            type: z.enum(['oauth', 'secret_sharing', 'embedded_wallet']),
            supportedScopes: z.array(z.string()),
            supportedServices: z.array(z.string()),
            metadata: z.record(z.any()),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    }),

  userAuthOptions: () =>
    queryOptions({
      queryKey: hubQueries.userAuth(),
      queryFn: async () => {
        const response = await api('/hub/auth/user', {
          schema: responseSchema(z.array(z.object({
            user_service_connections: z.object({
              id: z.string().uuid(),
              userId: z.string().uuid(),
              clientId: z.string().uuid(),
              scopes: z.array(z.string()).nullable(),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
            service_clients: z.object({
              clientId: z.string().uuid(),
              name: z.string(),
              type: z.enum(['oauth', 'secret_sharing', 'embedded_wallet']),
              supportedScopes: z.array(z.string()),
              supportedServices: z.array(z.string()),
            }),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 2 * 60 * 1000,
    }),

  userAuthConnectionOptions: (id: string) =>
    queryOptions({
      queryKey: hubQueries.userAuthConnection(id),
      queryFn: async () => {
        const response = await api(`/hub/auth/user/${id}`, {
          schema: responseSchema(z.object({
            id: z.string().uuid(),
            userId: z.string().uuid(),
            clientId: z.string().uuid(),
            credentials: z.record(z.any()),
            metadata: z.record(z.any()),
            policy: z.record(z.any()),
            scopes: z.array(z.string()).nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
    }),

  oauthClientsOptions: () =>
    queryOptions({
      queryKey: hubQueries.oauthClients(),
      queryFn: async () => {
        const response = await api('/hub/oauth-clients', {
          schema: responseSchema(z.array(z.object({
            clientId: z.string().uuid(),
            developerId: z.string().uuid(),
            name: z.string(),
            redirectUris: z.array(z.string().url()),
            metadata: z.record(z.any()),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          }))),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    }),

  oauthClientOptions: (id: string) =>
    queryOptions({
      queryKey: hubQueries.oauthClient(id),
      queryFn: async () => {
        const response = await api(`/hub/oauth-clients/${id}`, {
          schema: responseSchema(z.object({
            clientId: z.string().uuid(),
            developerId: z.string().uuid(),
            name: z.string(),
            redirectUris: z.array(z.string().url()),
            metadata: z.record(z.any()),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })),
        })
        if (response.status === 'FAILED') {
          throw new Error(response.error)
        }
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    }),
}
```

## 3. Mutations

```typescript
// src/lib/mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, authApi, responseSchema } from './api'
import { packageQueries, creditQueries, knowledgeQueries, userQueries } from './queries'
import { z } from 'zod'

// ===== USER MUTATIONS =====
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      email: string
      role: 'admin' | 'developer' | 'viewer' | 'super_admin'
    }) => {
      const response = await authApi('/users', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.object({
          user: userSchema,
          tokens: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
            expiresAtAccess: z.string().datetime(),
            expiresAtRefresh: z.string().datetime(),
          }),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.tokens.accessToken)
      localStorage.setItem('refresh_token', data.tokens.refreshToken)
      queryClient.setQueryData(userQueries.me(), data.user)
    },
  })
}

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      role?: 'admin' | 'developer' | 'viewer' | 'super_admin'
    }) => {
      const response = await api('/users', {
        method: 'PUT',
        body: data,
        schema: responseSchema(userSchema),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userQueries.me(), data)
    },
  })
}

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api('/users', { method: 'DELETE' })
      return response
    },
    onSuccess: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}

export const useDisconnectOAuthMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (provider: string) => {
      const response = await api('/users/auth/disconnect', {
        method: 'DELETE',
        params: { provider },
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.all() })
    },
  })
}

// ===== AUTH MUTATIONS =====
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (provider: 'google' | 'github') => {
      const response = await authApi('/users/auth/url', {
        method: 'GET',
        params: { type: provider },
        schema: responseSchema(z.object({ url: z.string().url() })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.url
    },
  })
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await api('/users/auth/revoke-refresh', { method: 'POST' })
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    onSuccess: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}

export const useRefreshTokenMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await authApi('/users/auth/refresh', {
        method: 'POST',
        schema: responseSchema(z.object({
          accessToken: z.string(),
          expiresAt: z.string().datetime(),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.accessToken)
    },
  })
}

// ===== HUB MUTATIONS =====
export const useCreateServiceConnectionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { type: string; scopes: string[] }) => {
      const response = await api('/hub/auth/url', {
        method: 'GET',
        params: data,
        schema: responseSchema(z.object({ url: z.string().url() })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })
}

export const useDisconnectServiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userServiceConnectionId: string) => {
      const response = await api('/hub/auth/disconnect', {
        method: 'DELETE',
        params: { userServiceConnetionId: userServiceConnectionId },
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() })
    },
  })
}

export const useCreateSecretSharingMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      serviceClientId: string
      secret: Record<string, any>
    }) => {
      const response = await api('/hub/secret/create', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() })
    },
  })
}

export const useCreateWalletMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      chain: string
      options?: { curve?: string; path?: string }
      policy: Record<string, any>
    }) => {
      const response = await api('/hub/wallet/create', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() })
    },
  })
}

export const useUpdateWalletMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      policy: Record<string, any>
    }) => {
      const response = await api('/hub/wallet/update', {
        method: 'PATCH',
        body: data,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: hubQueries.userAuthConnection(variables.id) 
      })
    },
  })
}

// OAuth Client Management
export const useCreateOAuthClientMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      redirectUris: string[]
      metadata?: Record<string, any>
    }) => {
      const response = await api('/hub/oauth-clients', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.object({
          clientId: z.string().uuid(),
          developerId: z.string().uuid(),
          name: z.string(),
          redirectUris: z.array(z.string().url()),
          metadata: z.record(z.any()),
          createdAt: z.string(),
          updatedAt: z.string(),
          clientSecret: z.string(),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() })
    },
  })
}

export const useUpdateOAuthClientMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      clientId: string
      name?: string
      redirectUris?: string[]
      metadata?: Record<string, any>
    }) => {
      const { clientId, ...updateData } = data
      const response = await api(`/hub/oauth-clients/${clientId}`, {
        method: 'PUT',
        body: updateData,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() })
      queryClient.invalidateQueries({ 
        queryKey: hubQueries.oauthClient(variables.clientId) 
      })
    },
  })
}

export const useDeleteOAuthClientMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await api(`/hub/oauth-clients/${clientId}`, {
        method: 'DELETE',
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubQueries.oauthClients() })
    },
  })
}

export const useRegenerateOAuthSecretMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await api(`/hub/oauth-clients/${clientId}/regenerate-secret`, {
        method: 'POST',
        schema: responseSchema(z.object({
          clientId: z.string().uuid(),
          developerId: z.string().uuid(),
          name: z.string(),
          redirectUris: z.array(z.string().url()),
          metadata: z.record(z.any()),
          createdAt: z.string(),
          updatedAt: z.string(),
          clientSecret: z.string(),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ 
        queryKey: hubQueries.oauthClient(clientId) 
      })
    },
  })
}

// MCP Action Execution
export const useExecuteMcpActionMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      deploymentId: string
      service: string
      path: string
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: any
    }) => {
      const { deploymentId, service, path, method, body } = data
      const response = await api(`/hub/action/${deploymentId}/${service}${path}`, {
        method,
        body,
      })
      return response
    },
  })
}

// ===== PACKAGE MUTATIONS =====
export const useCreatePackageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      clientId: string
      description: string
      latestVersion: string
      metadata: any
      externalSource: {
        sourceType: 'pypi' | 'npm' | 'github'
        sourceIdentifier: string
      }
      supportedServiceClients: Array<{
        serviceClientId: string
        scopes: string[]
        policy?: Record<string, any>
      }>
    }) => {
      const response = await api('/packages', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.object({
          package: packageSchema,
          externalSource: z.any(),
          supportedServiceClients: z.array(z.any()),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() })
    },
  })
}

export const useUpdatePackageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      packageId: string
      name?: string
      description?: string
      latestVersion?: string
      metadata?: any
      externalSource?: {
        sourceType: 'pypi' | 'npm' | 'github'
        sourceIdentifier: string
      }
      supportedServiceClients?: Array<{
        serviceClientId: string
        scopes: string[]
        policy?: Record<string, any>
      }>
    }) => {
      const { packageId, ...updateData } = data
      const response = await api(`/packages/${packageId}`, {
        method: 'PATCH',
        body: updateData,
        schema: responseSchema(z.object({
          package: packageSchema,
          externalSource: z.any().nullable(),
          supportedServiceClients: z.array(z.any()),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() })
      queryClient.invalidateQueries({ 
        queryKey: packageQueries.detail(variables.packageId) 
      })
    },
  })
}

export const useDeletePackageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (packageId: string) => {
      const response = await api(`/packages/${packageId}`, {
        method: 'DELETE',
        schema: responseSchema(z.object({ message: z.string() })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.lists() })
    },
  })
}

export const useInstallPackageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { packageId: string; version: string }) => {
      const response = await api('/packages/install', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.object({
          userMcpId: z.string().uuid(),
          userId: z.string().uuid(),
          packageId: z.string().uuid(),
          version: z.string(),
          installedAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.userInstalled() })
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() })
    },
  })
}

export const useDeployPackageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      packageId: string
      version: string
      url: string
      scopes: string[]
      authData: any
      connectionIds: string[]
    }) => {
      const response = await api('/packages/deploy', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.object({
          deployment: z.any(),
          serviceConnectionAssociations: z.array(z.any()),
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageQueries.userDeployments() })
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() })
    },
  })
}

// ===== CREDIT MUTATIONS =====
export const useHelioDepositMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      amount: string
      paymentMethod: 'helio_web3'
      userEmail?: string
      chargeType?: 'paylink' | 'charge'
    }) => {
      const response = await api('/credits/deposit/helio', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.object({
          type: z.enum(['charge', 'paylink']),
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
        })),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() })
      queryClient.invalidateQueries({ queryKey: creditQueries.deposits() })
    },
  })
}

export const useStripeDepositMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      amount: string
      paymentMethod: 'stripe_card'
      currency?: 'USD' | 'EUR' | 'GBP'
      successUrl?: string
      cancelUrl?: string
    }) => {
      const response = await api('/credits/deposit/stripe', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() })
      queryClient.invalidateQueries({ queryKey: creditQueries.deposits() })
    },
  })
}

export const useCashoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      creditAmount: string
      payoutMethod: 'crypto' | 'bank' | 'paypal'
      payoutDetails: {
        stableCoin?: 'USDC' | 'USDT'
        networkName?: 'solana' | 'base' | 'ethereum' | 'bitcoin'
        address?: string
        routingNumber?: string
        accountNumber?: string
        accountType?: 'checking' | 'savings'
        email?: string
      }
    }) => {
      const response = await api('/credits/cashout', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueries.balance() })
      queryClient.invalidateQueries({ queryKey: creditQueries.cashouts() })
    },
  })
}

// ===== KNOWLEDGE BASE MUTATIONS =====
export const useCreateKnowledgeBaseMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      description: string
      tags: string[]
      coverImageUrl?: string
      isPublic?: boolean
      publicMetadata?: { price: number }
    }) => {
      const response = await api('/knowledge-base', {
        method: 'POST',
        body: data,
        schema: responseSchema(knowledgeBaseSchema),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.bases() })
    },
  })
}

export const useAddKnowledgeSourceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      knowledgeBaseId: string
      sourceType: 'url' | 'file' | 'text' | 'image' | 'youtube_url'
      source?: string
      file?: File
    }) => {
      const formData = new FormData()
      formData.append('sourceType', data.sourceType)
      if (data.source) formData.append('source', data.source)
      if (data.file) formData.append('file', data.file)

      const response = await api(`/knowledge-base/${data.knowledgeBaseId}/add-source`, {
        method: 'POST',
        body: formData,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: knowledgeQueries.sources(variables.knowledgeBaseId) 
      })
    },
  })
}

export const useAddKnowledgeUnitMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      knowledgeSourceId: string
      name: string
      content: string
      tags: string[]
      type: string
    }) => {
      const response = await api('/knowledge-base/add-knowledge-unit', {
        method: 'POST',
        body: data,
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() })
    },
  })
}

export const useRetryKnowledgeSourceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (knowledgeSourceId: string) => {
      const response = await api(`/knowledge-base/${knowledgeSourceId}/retry-source`, {
        method: 'POST',
        schema: responseSchema(z.any()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() })
    },
  })
}

export const useUpdateKnowledgeUnitMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      knowledgeUnitId: string
      name?: string
      content?: string
      tags?: string[]
      type?: string
    }) => {
      const { knowledgeUnitId, ...updateData } = data
      const response = await api(`/knowledge-base/${knowledgeUnitId}`, {
        method: 'PATCH',
        body: updateData,
        schema: responseSchema(z.string()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() })
    },
  })
}

export const useDeleteKnowledgeUnitMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (knowledgeUnitId: string) => {
      const response = await api(`/knowledge-base/${knowledgeUnitId}`, {
        method: 'DELETE',
        schema: responseSchema(z.string()),
      })
      if (response.status === 'FAILED') {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueries.all() })
    },
  })
}
```

## 4. Router Setup

```typescript
// src/router.tsx
import { createRouter, createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div>
      <Outlet />
    </div>
  ),
})

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined!, // Will be set in main.tsx
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

## 5. Route Examples

```typescript
// src/routes/packages.index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { packageQueries } from '../lib/queries'
import { z } from 'zod'

const packagesSearchSchema = z.object({
  page: z.number().optional().default(1),
  search: z.string().optional(),
  publisherId: z.string().optional(),
})

export const Route = createFileRoute('/packages/')({
  validateSearch: packagesSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(
      packageQueries.listOptions({
        page: deps.search.page,
        name: deps.search.search,
        publisherId: deps.search.publisherId,
      })
    ),
  component: PackagesPage,
})

function PackagesPage() {
  // const { page, search, publisherId } = Route.useSearch()
  const publisherId = '4beb08f3-a8d7-4610-987b-67763b4b8672'
  const page = 0
  const search = ''
  const { data: packages } = useSuspenseQuery(
    packageQueries.listOptions({
      page,
      name: search,
      publisherId,
    })
  )

  return (
    <div>
      <h1>Packages</h1>
      <div className="grid gap-4">
        {packages.data.map((pkg) => (
          <div key={pkg.packageId} className="border p-4 rounded">
            <h3>{pkg.name}</h3>
            <p>{pkg.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 6. Main App Setup

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

router.update({
  context: {
    queryClient,
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

## 7. Environment Variables

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000/v1
```

## 8. Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
})
``` 

## Comprehensive API Coverage

### ✅ **Fully Covered Endpoints:**

**User Management:**
- GET `/users` - Get current user profile
- POST `/users` - Create new user account  
- PUT `/users` - Update user profile
- DELETE `/users` - Delete user account
- GET `/users/auth` - Get user auth providers
- GET `/users/auth/url` - Generate OAuth URL
- DELETE `/users/auth/disconnect` - Disconnect OAuth provider
- POST `/users/auth/refresh` - Refresh access token
- POST `/users/auth/revoke-refresh` - Revoke refresh token

**Hub & Service Connections:**
- GET `/hub/auth` - List available auth methods
- GET `/hub/auth/user` - Get user's service connections
- GET `/hub/auth/user/:id` - Get specific service connection
- GET `/hub/auth/url` - Create service auth URL
- DELETE `/hub/auth/disconnect` - Disconnect service
- POST `/hub/secret/create` - Create secret-sharing connection
- POST `/hub/wallet/create` - Create Turnkey wallet
- PATCH `/hub/wallet/update` - Update wallet policy
- GET `/hub/oauth-clients` - List OAuth clients
- GET `/hub/oauth-clients/:id` - Get OAuth client details
- POST `/hub/oauth-clients` - Create OAuth client
- PUT `/hub/oauth-clients/:id` - Update OAuth client
- DELETE `/hub/oauth-clients/:id` - Delete OAuth client
- POST `/hub/oauth-clients/:id/regenerate-secret` - Regenerate client secret
- ALL `/hub/action/:deploymentId/:service/*` - Execute MCP actions

**Package Management:**
- GET `/packages` - List packages with filtering
- GET `/packages/:id` - Get package details
- GET `/packages/github/available-packages` - Get GitHub repositories
- POST `/packages` - Create new package
- PATCH `/packages/:id` - Update package
- DELETE `/packages/:id` - Delete package
- GET `/packages/packages/user` - Get user's installed packages
- GET `/packages/package/deployments/:id` - Get deployment info
- GET `/packages/packages/user/deployments` - Get user deployments
- GET `/packages/packages/user/deployments/:id/auth` - Get deployment auth
- POST `/packages/install` - Install package
- POST `/packages/deploy` - Deploy package

**Credit System:**
- GET `/credits/balance` - Get credit balance
- GET `/credits/transactions` - Get transaction history
- GET `/credits/transfers` - Get credit transfers
- GET `/credits/deposit/methods` - Get available deposit methods
- POST `/credits/deposit/helio` - Create Helio deposit
- POST `/credits/deposit/stripe` - Create Stripe deposit
- GET `/credits/deposits` - Get deposit history
- POST `/credits/cashout` - Initiate cashout
- GET `/credits/cashouts` - Get cashout history
- GET `/credits/earnings` - Get developer earnings
- GET `/credits/spending` - Get user spending analytics

**Knowledge Bases:**
- GET `/knowledge-base` - List knowledge bases
- GET `/knowledge-base/:id` - Get knowledge base details
- GET `/knowledge-base/:id/sources` - Get knowledge sources
- GET `/knowledge-base/:id/units` - Get knowledge units
- POST `/knowledge-base` - Create knowledge base
- POST `/knowledge-base/add-knowledge-unit` - Add knowledge unit
- POST `/knowledge-base/:id/add-source` - Add knowledge source
- POST `/knowledge-base/:id/retry-source` - Retry source processing
- PATCH `/knowledge-base/:id` - Update knowledge unit
- DELETE `/knowledge-base/:id` - Delete knowledge unit

**System:**
- GET `/health` - System health check

### ❌ **Not Covered (Handled by Browser/External):**

**OAuth Callbacks:**
- GET `/users/auth/:provider/callback` - OAuth provider callbacks
- GET `/hub/auth/:serviceClient/callback` - Service client callbacks

**OAuth Flow Endpoints:**
- GET `/hub/url` - Generate Osiris OAuth URL
- POST `/hub/authorize` - Authorize OAuth request
- POST `/hub/token` - Exchange code for token
- POST `/hub/revoke` - Revoke OAuth token

**Webhook Endpoints:**
- POST `/webhooks/helio` - Public Helio webhook
- POST `/webhooks/stripe` - Public Stripe webhook
- POST `/credits/webhooks/helio` - Protected Helio webhook (for testing)

*These endpoints are either handled automatically by the browser during OAuth flows or are server-to-server webhook endpoints that don't need frontend integration.*