import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capabilities, McpCapabilitiesList } from "./capabilites-list";
import { McpActionTable } from "./mcp-action-table";
import { authenticators, McpAuthList } from "./mcp-auth";
import { type McpServer, ServerList } from "./mcp-servers";
import { McpDetailsView } from "./mcp-details-view";

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

export function McpTabs() {
	return (
		<Tabs defaultValue="readme" className="flex w-full flex-col gap-y-8">
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 py-0 px-6">
				<TabsTrigger value="readme">
					<ICONS.readme /> Readme
				</TabsTrigger>
				<TabsTrigger value="capabilities">
					<ICONS.cap /> Capabilities
				</TabsTrigger>
				<TabsTrigger value="authenticators">
					<ICONS.auth /> Authenticators
				</TabsTrigger>
				<TabsTrigger value="servers">
					<ICONS.servers /> Servers
				</TabsTrigger>
				<TabsTrigger value="actions">
					<ICONS.versions /> Actions
				</TabsTrigger>
			</TabsList>
			<TabsContent value="readme">
				<TabLayout>
					<div>
						<h1>Readme</h1>
					</div>
				</TabLayout>
			</TabsContent>
			<TabsContent value="capabilities">
				<TabLayout>
					<McpCapabilitiesList data={capabilities} />
				</TabLayout>
			</TabsContent>
			<TabsContent  value="authenticators">
				<TabLayout>
					<McpAuthList data={authenticators} />
				</TabLayout>
			</TabsContent>
			<TabsContent value="servers">
				<TabLayout>
					<ServerList data={servers} />
				</TabLayout>
			</TabsContent>
			<TabsContent value="actions">
				<TabLayout>
					<McpActionTable />
				</TabLayout>
			</TabsContent>
		</Tabs>
	);
}

function TabLayout({ children }: { children: React.ReactNode }) {
	return <div className="px-6 flex gap-6">
		<div className="w-full">
			{children}
		</div>
		<McpDetailsView />
	</div>
}
