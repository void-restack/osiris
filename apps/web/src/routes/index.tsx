import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import { createFileRoute } from "@tanstack/react-router";
import { McpVersions } from "@/components/features/mcp-details/mcp-versions";
import { InstallAction } from "@/components/features/mcp-details/install-action";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { capabilities, McpCapabilitiesList } from "@/components/features/mcp-details/capabilites-list";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return <div>
		<McpSearchBox />
		<McpDetailsHeader />
		<McpCapabilitiesList data={capabilities} />
	</div>;
}
