import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capabilities, McpCapabilitiesList } from "./capabilites-list";
import { McpActionTable } from "./mcp-action-table";
import { authenticators, McpAuthList } from "./mcp-auth";
import { type McpServer, ServerList } from "./mcp-servers";

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
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 py-0">
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
			<TabsContent value="readme" />
			<TabsContent value="capabilities">
				<McpCapabilitiesList data={capabilities} />
			</TabsContent>
			<TabsContent value="authenticators">
				<McpAuthList data={authenticators} />
			</TabsContent>
			<TabsContent value="servers">
				<ServerList data={servers} />
			</TabsContent>
			<TabsContent value="actions">
				<McpActionTable />
			</TabsContent>
		</Tabs>
	);
}
