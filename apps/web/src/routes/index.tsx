import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import { createFileRoute } from "@tanstack/react-router";
import { McpVersions } from "@/components/features/mcp-details/mcp-versions";
import { InstallAction } from "@/components/features/mcp-details/install-action";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { capabilities, McpCapabilitiesList } from "@/components/features/mcp-details/capabilites-list";
import { ServerList, type McpServer } from "@/components/features/mcp-details/mcp-servers";
import { McpActionTable } from "@/components/features/mcp-details/mcp-action-table";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

const servers: McpServer[] = [
	{
		name: "Server 1",
		createdAt: "2021-01-01",
		apps: [
			{
				icon: "/test/gmail.svg",
				name: "Gmail",
				scopes: 1,
				isAuthenticated: false,
			},
			{
				icon: "/test/calander.svg",
				name: "Calendar",
				scopes: 1,
				isAuthenticated: false,
			},
			{
				icon: "/test/contact.svg",
				name: "Contact",
				scopes: 10,
				isAuthenticated: true,
			},
		],
	},
	{
		name: "Server 1",
		createdAt: "2021-01-01",
		apps: [
			{
				icon: "/test/gmail.svg",
				name: "Gmail",
				scopes: 1,
				isAuthenticated: false,
			},
			{
				icon: "/test/calander.svg",
				name: "Calendar",
				scopes: 1,
				isAuthenticated: false,
			},
			{
				icon: "/test/contact.svg",
				name: "Contact",
				scopes: 10,
				isAuthenticated: true,
			},
		],
	},
];

function HomeComponent() {
	return <div>
		<McpSearchBox />
		<McpDetailsHeader />
		{/* <McpCapabilitiesList data={capabilities} /> */}
		<div className="px-10">
		<ServerList data={servers} />
		<McpActionTable />
		</div>
	</div>;
}
