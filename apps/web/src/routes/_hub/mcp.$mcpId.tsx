import { createFileRoute } from "@tanstack/react-router";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";
import { packageQueries } from "@/lib/queries";

export const Route = createFileRoute("/_hub/mcp/$mcpId")({
	component: SlugComponent,
	loader: async ({ context: { queryClient }, params: { mcpId } }) => {
		// Fetch package details (public data)
		const packageData = await queryClient.ensureQueryData(packageQueries.detailOptions(mcpId));
		// Fetch auth scopes (public data)
		await queryClient.ensureQueryData(packageQueries.authScopesOptions(mcpId));
		// Fetch actions (public data)
		await queryClient.ensureQueryData(packageQueries.actionsOptions(mcpId));
		// Fetch MCP tools if server URL is available
		if (packageData?.url) {
			await queryClient.ensureQueryData(packageQueries.mcpToolsOptions(packageData.url));
		}
		return { breadcrumb: "Package Details" };
	},
});

function SlugComponent() {
	return (
		<main className="flex h-full flex-col gap-4">
			<McpDetailsHeader />
			<McpTabs />
		</main>
	);
}
