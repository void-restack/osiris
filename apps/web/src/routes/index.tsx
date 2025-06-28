import { createFileRoute } from "@tanstack/react-router";
import HubLayout from "@/components/layouts/hub-layout";
// import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
// import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";
// import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<HubLayout />
		// <div>
		// 	<McpSearchBox />
		// 	<McpDetailsHeader />
		// 	{/* <McpCapabilitiesList data={capabilities} /> */}
		// 	<div className=" w-full">
		// 		<McpTabs />
		// 	</div>
		// </div>
	);
}
