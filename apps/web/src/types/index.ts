import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "developer", "viewer", "super_admin"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
});

export const packageListSchema = z.object({
  packageId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  url: z.string(),
  description: z.string(),
  shortDescription: z.string().nullable(),
  latestVersion: z.string(),
  publisherId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  iconUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
  isLive: z.boolean().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  paymentConfig: z.any().nullable(),
  publisher: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    imageUrl: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).optional(),
});

export const packageSchema = z.object({
  packageId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  publisherId: z.string().uuid(),
  latestVersion: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const popularPackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  iconUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  description: z.string(),
  shortDescription: z.string().nullable(),
  latestVersion: z.string(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),
  isLive: z.boolean().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deploymentCount: z.number(),
  paymentConfig: z.any().nullable(),
  publisher: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    imageUrl: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).optional(),
});

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
});

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
    ratingCount: z.number(),
  }),
  iconUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schema for knowledge base ratings
export const knowledgeBaseRatingSchema = z.object({
  ratingId: z.string().uuid(),
  knowledgeBaseId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schema for user installed knowledge bases
export const userInstalledKnowledgeBaseSchema = z.object({
  // Add fields as needed based on API response
  // For now, using nullable since the API returns null
}).nullable();

// Schema for the joined response structure
export const knowledgeBaseJoinedSchema = z.object({
  knowledge_bases: knowledgeBaseSchema,
  knowledge_base_ratings: knowledgeBaseRatingSchema.nullable(),
  user_installed_knowledge_bases: userInstalledKnowledgeBaseSchema,
});

export const installedKnowledgeBaseSchema = z.object({
  knowledgeBaseId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  userId: z.string().uuid(),
  isPublic: z.boolean(),
  publicMetadata: z.object({
    price: z.number(),
    rating: z.number(),
    downloads: z.number(),
    ratingCount: z.number(),
  }),
  coverImageUrl: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  iconUrl: z.string().nullable(),
  user: z.object({
    userId: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    imageUrl: z.string().nullable(),
  }),
});

export interface Package {
  packageId: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  publisherId: string;
  latestVersion: string;
  metadata?: Record<string, any>;
  iconUrl?: string | null;
  coverImageUrl?: string | null;
  paymentConfig?: any | null;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  type?: string;
  url?: string;
}

export interface PopularPackage {
  id: string;
  name: string;
  url: string;
  type: string;
  iconUrl: string | null;
  coverImageUrl: string | null;
  description: string;
  shortDescription: string | null;
  latestVersion: string;
  metadata?: Record<string, any>;
  tags: string[];
  isLive?: boolean;
  createdAt: string;
  updatedAt: string;
  deploymentCount: number;
  paymentConfig: any | null;
  publisher?: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface PackageWithUserStatus extends Package {
  isInstalled: boolean;
  isDeployed: boolean;
  clientId?: string;
  userInstallation?: {
    userMcpId: string;
    userId: string;
    packageId: string;
    version: string;
    installedAt: string;
    updatedAt: string;
    package: Package;
  };
  userDeployment?: {
    deployment: {
      deploymentId: string;
      userMcpId: string;
      url: string;
      scopes: string[];
      status: "active" | "inactive" | "pending";
      createdAt: string;
      updatedAt: string;
    };
    userMcpId: string;
    package: Package;
  };
}

// Response wrappers
const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    status: z.literal("SUCCESS"),
    data: dataSchema,
  });

const errorResponseSchema = z.object({
  status: z.literal("FAILED"),
  error: z.string(),
});

export const responseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.discriminatedUnion("status", [
    successResponseSchema(dataSchema),
    errorResponseSchema,
  ]);

export const oauthClientSchema = z.object({
  clientId: z.string().uuid(),
  developerId: z.string().uuid(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  redirectUris: z.array(z.string()),
  metadata: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
export type PackageList = z.infer<typeof packageListSchema>;
export type CreditAccount = z.infer<typeof creditAccountSchema>;
export type KnowledgeBase = z.infer<typeof knowledgeBaseSchema>;
export type InstalledKnowledgeBase = z.infer<typeof installedKnowledgeBaseSchema>;
export type KnowledgeBaseRating = z.infer<typeof knowledgeBaseRatingSchema>;
export type KnowledgeBaseJoined = z.infer<typeof knowledgeBaseJoinedSchema>;
export type OAuthClient = z.infer<typeof oauthClientSchema>;

export type ViewMode = "grid" | "table";
export type SortOption =
  | "latest"
  | "relevant"
  | "new"
  | "scopes"
  | "name"
  | "type";

export interface FilterOptions {
  searchQuery: string;
  type: string[];
  scopeRange: [number, number] | null;
  dateRange: [Date, Date] | null;
}

export interface SortConfig {
  field: SortOption;
  direction: "asc" | "desc";
}

export interface Permission {
  id: string;
  label: string;
}