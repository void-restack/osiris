import { createFileRoute } from "@tanstack/react-router";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";
import { packageQueries } from "@/lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_hub/mcp/$mcpId")({
	component: SlugComponent,
	loader: async ({ context: { queryClient }, params: { mcpId } }) => {
		const { data: mcp } = await queryClient.ensureQueryData(packageQueries.detailOptions(mcpId));
	},
});

function SlugComponent() {
	const { mcpId } = Route.useParams();
	const { data: mcp } = useSuspenseQuery(packageQueries.detailOptions(mcpId));
	return (
		<main className="flex h-full flex-col gap-4">
			<McpDetailsHeader mcp={mcp} />
			<McpTabs />
		</main>
	);
}
