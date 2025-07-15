import { createFileRoute } from "@tanstack/react-router";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";

export const Route = createFileRoute("/_hub/mcp/$mcpId")({
	component: SlugComponent,
});

function SlugComponent() {
	return (
		<main className="flex h-full flex-col gap-4">
			<McpDetailsHeader />
			<McpTabs />
		</main>
	);
}
