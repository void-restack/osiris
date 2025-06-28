import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import { createFileRoute } from "@tanstack/react-router";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});


function HomeComponent() {
	return <div>
		<McpSearchBox />
		<McpDetailsHeader />
		{/* <McpCapabilitiesList data={capabilities} /> */}
		<div className=" w-full">
			<McpTabs />
		</div>
	</div>;
}
