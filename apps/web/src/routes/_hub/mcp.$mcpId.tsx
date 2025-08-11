import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";
import { packageQueries } from "@/lib/queries";
import { McpDetailHeaderSkeleton } from "@/components/skeletons/mcp-skeleton";
import { isAuthenticated } from "@/lib/auth-optimized";


export const Route = createFileRoute("/_hub/mcp/$mcpId")({
	component: SlugComponent,
	loader: async ({ context: { queryClient }, params: { mcpId } }) => {
		const authenticated = isAuthenticated();

		// Fetch package details (public data)
		const packageData = await queryClient.ensureQueryData(packageQueries.detailOptions(mcpId));
		// Fetch auth scopes (public data)
		await queryClient.ensureQueryData(packageQueries.authScopesOptions(mcpId));
		// Fetch actions (user-specific data, only if authenticated)
		if (authenticated) {
			await queryClient.ensureQueryData(packageQueries.actionsOptions(mcpId, authenticated, { page: 1, limit: 5 }));
			await queryClient.ensureQueryData(packageQueries.userDeploymentsForPackageOptions(mcpId, { page: 1, limit: 5 }));
		}
		// Fetch MCP tools if server URL is available (public data with fallbacks)
		if (packageData?.url) {
			await queryClient.ensureQueryData(packageQueries.mcpToolsOptions(packageData.url));
		}
		return { breadcrumb: "Package Details", authenticated };
	},
});

function SlugComponent() {

	return (
		<main className="flex h-full flex-col gap-4">
			<Suspense fallback={<McpDetailHeaderSkeleton />}>
				<McpDetailsHeader />
			</Suspense>
			<Suspense fallback={<div className="space-y-4"><div className="h-10 bg-gray-100 rounded animate-pulse" /><div className="h-64 bg-gray-100 rounded animate-pulse" /></div>}>
				<McpTabs />
			</Suspense>

		</main>
	);
}
