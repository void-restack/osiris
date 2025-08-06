import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { McpCapabilitiesList } from "./capabilites-list";
import { McpActionTable } from "./mcp-action-table";
import { McpAuthList } from "./mcp-auth";
import { McpDetailsView } from "./mcp-details-view";
import { type McpServer, ServerList } from "./mcp-servers";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import { isAuthenticated } from "@/lib/auth-optimized";
import { ToolCaseIcon } from "lucide-react";

const servers: McpServer[] = [];

export function McpTabs() {
	const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
	const authenticated = isAuthenticated();

	const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(mcpId));
	const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(mcpId));

	const { data: actions } = useQuery({
		...packageQueries.actionsOptions(mcpId, authenticated),
		enabled: authenticated,
	});

	const serverUrl = packageData?.url || '';

	const { data: mcpTools } = useSuspenseQuery(
		packageQueries.mcpToolsOptions(serverUrl)
	);

	const transformedCapabilities = (mcpTools as any)?.tools?.map((tool: any, index: number) => ({
		id: tool.name || `tool-${index}`,
		title: tool.name || 'Unknown Tool',
		description: tool.description || 'No description available',
		icon: ToolCaseIcon,
		inputSchema: tool.inputSchema,
	}))


	const transformedAuthenticators = authScopes?.serviceClientMap ?
		Object.entries(authScopes.serviceClientMap).map(([serviceName, serviceData]: [string, any]) => ({
			id: serviceName.toLowerCase(),
			name: serviceName,
			icon: `/test/${serviceName.toLowerCase()}.svg`,
			scopes: serviceData.requiredScopes || [],
		})) : [];

	const transformedActions = (authenticated && actions) ? actions.map((action: any) => ({
		name: action.name || action.actionName,
		description: action.description || action.actionDescription,
		method: action.method || action.httpMethod,
		path: action.path || action.endpoint,
		service: action.service || action.serviceName,
	})) : [];

	return (
		<Tabs defaultValue="readme" className="flex w-full flex-col gap-y-8">
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 px-6 py-0">
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
						<h1 className="text-xl font-medium text-primary-800 mb-4">Readme</h1>
						<div className="prose prose-sm max-w-none">
							<p className="text-primary-600">{packageData?.description || "No description available."}</p>
						</div>
					</div>
				</TabLayout>
			</TabsContent>
			<TabsContent value="capabilities">
				<TabLayout>
					<McpCapabilitiesList data={transformedCapabilities} />
				</TabLayout>
			</TabsContent>
			<TabsContent value="authenticators">
				<TabLayout>
					<McpAuthList data={transformedAuthenticators} />
				</TabLayout>
			</TabsContent>
			<TabsContent value="servers">
				<TabLayout>
					<ServerList data={servers} />
				</TabLayout>
			</TabsContent>
			<TabsContent value="actions">
				<TabLayout>
					{!authenticated ? (
						<div className="text-center py-8">
							<p className="text-primary-600 mb-4">Sign in to view package actions and deployment history.</p>
							<div className="text-sm text-primary-500">
								Actions show the available operations and recent activity for this package.
							</div>
						</div>
					) : (
						<McpActionTable data={transformedActions} />
					)}
				</TabLayout>
			</TabsContent>
		</Tabs>
	);
}

function TabLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex gap-6 px-6">
			<div className="w-full">{children}</div>
			<McpDetailsView />
		</div>
	);
}
