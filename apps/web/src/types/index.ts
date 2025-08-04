import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "developer", "viewer", "super_admin"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
});

export const packageSchema = z.object({
  packageId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  publisherId: z.string().uuid().nullable(),
  latestVersion: z.string().nullable(),
  metadata: z.record(z.any()),
  embedding: z.any().nullable(),
  iconUrl: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
  }),
  iconUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export interface PackageWithUserStatus extends Package {
  isInstalled: boolean;
  isDeployed: boolean;
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

export type User = z.infer<typeof userSchema>;
export type Package = z.infer<typeof packageSchema>;
export type CreditAccount = z.infer<typeof creditAccountSchema>;
export type KnowledgeBase = z.infer<typeof knowledgeBaseSchema>;

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
