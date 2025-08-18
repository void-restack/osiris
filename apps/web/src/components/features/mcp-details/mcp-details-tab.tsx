import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { McpCapabilitiesList } from "./capabilites-list";
import { McpActionsTable } from "./mcp-actions-table";
import { McpServersTable } from "./mcp-servers-table";
import { McpAuthList } from "./mcp-auth";
import { McpDetailsView } from "./mcp-details-view";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { ToolCaseIcon } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function McpTabs() {
	const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
	const { isAuthenticated } = useAuth();
	const [serversPage, setServersPage] = useState(1);
	const [actionsPage, setActionsPage] = useState(1);

	const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(mcpId));
	const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(mcpId));

	const { data: actionsData } = useQuery({
		...packageQueries.actionsOptions(mcpId, isAuthenticated, { page: actionsPage, limit: 5 }),
		enabled: isAuthenticated,
		placeholderData: (previousData) => previousData,
	});

	const { data: serversData } = useQuery({
		...packageQueries.userDeploymentsForPackageOptions(mcpId, { page: serversPage, limit: 5 }),
		enabled: isAuthenticated,
		placeholderData: (previousData) => previousData,
	});

	const serverUrl = packageData?.url || '';

	console.log(serverUrl && !/\/mcp(\/|$)/.test(serverUrl) ? `${serverUrl}/mcp` : serverUrl, "SERVER URL")
	const { data: mcpTools } = useQuery({
		...packageQueries.mcpToolsOptions(serverUrl && !/\/mcp(\/|$)/.test(serverUrl) ? `${serverUrl}/mcp` : serverUrl),
		enabled: !!serverUrl, // Only run query if serverUrl exists
	});

	const transformedCapabilities = (mcpTools as any)?.tools?.map((tool: any, index: number) => {
		// Add safety check for tool
		if (!tool) {
			return null; // Skip invalid tools
		}

		return {
			id: tool.name || `tool-${index}`,
			title: tool.name || 'Unknown Tool',
			description: tool.description || 'No description available',
			icon: ToolCaseIcon,
			inputSchema: tool.inputSchema,
		};
	}).filter((item: any) => item !== null) || [];

	const transformedAuthenticators = authScopes?.serviceClients ?
		authScopes.serviceClients.map((serviceClient: any) => ({
			id: serviceClient.name.toLowerCase(),
			name: serviceClient.name,
			description: serviceClient.description,
			icon: serviceClient.iconUrl || `/test/${serviceClient.name.toLowerCase()}.svg`,
			scopes: serviceClient.allowedScopes || [],
			scopeDefinitions: serviceClient.scopeDefinitions || {},
			metadata: serviceClient.metadata || {},
		})) : [];

	const finalActionsData = actionsData || { data: [] };

	const finalTransformedActions = finalActionsData.data?.map((action: any) => ({
		actionId: action.mcp_actions.actionId,
		deploymentId: action.mcp_actions.deploymentId,
		userId: action.mcp_actions.userId,
		connectionId: action.mcp_actions.connectionId,
		actionType: action.mcp_actions.actionType || "Unknown Action",
		request: action.mcp_actions.request,
		response: action.mcp_actions.response,
		status: action.mcp_actions.status,
		errorMessage: action.mcp_actions.errorMessage,
		createdAt: action.mcp_actions.createdAt,
		updatedAt: action.mcp_actions.updatedAt,
	})) || [];

	const transformedServers = serversData?.data?.map((deployment: any) => {
		if (!deployment) {
			return null;
		}

		// Construct deployment URL: packageUrl?deploymentId=deploymentId
		const deploymentUrl = packageData?.url ?
			`${packageData.url}?deploymentId=${deployment.deploymentId}` :
			'No URL';

		return {
			deploymentId: deployment.deploymentId,
			userMcpId: deployment.userMcpId,
			url: deploymentUrl,
			scopes: deployment.userServiceConnectionMcpDeployments?.[0]?.scopes || [],
			status: deployment.status,
			createdAt: deployment.createdAt,
			updatedAt: deployment.updatedAt,
			userServiceConnectionMcpDeployments: deployment.userServiceConnectionMcpDeployments,
			name: deployment.name
		};
	}).filter(Boolean) || [];

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
					<div className="w-full max-w-none">
						{packageData?.description ? (
							<ScrollArea className="h-[calc(100vh-200px)] hidebar">
								<div className="rounded-lg max-h-[calc(100vh-480px)] hidebar overflow-y-auto">
									<MarkdownRenderer
										content={packageData.description}
									/>
								</div>
							</ScrollArea>
						) : (
							<div className="text-primary-600 text-center py-12 bg-primary-25">
								<p className="text-lg font-medium mb-2">No README content available</p>
								<p className="text-sm text-primary-500">This package doesn't have documentation yet.</p>
							</div>
						)}
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
					{!isAuthenticated ? (
						<div className="text-center py-8">
							<p className="text-primary-600 mb-4">Sign in to view your deployed servers.</p>
							<div className="text-sm text-primary-500">
								Deployed servers show your active instances of this MCP package.
							</div>
						</div>
					) : transformedServers.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-primary-600 mb-4">No deployed servers found</p>
							<div className="text-sm text-primary-500">
								You haven't deployed any instances of this MCP package yet.
							</div>
						</div>
					) : (
						<McpServersTable
							data={transformedServers}
							pagination={(serversData as any)?.pagination}
							onPageChange={(page) => setServersPage(page)}
						/>
					)}
				</TabLayout>
			</TabsContent>
			<TabsContent value="actions">
				<TabLayout>
					{!isAuthenticated ? (
						<div className="text-center py-8">
							<p className="text-primary-600 mb-4">Sign in to view package actions and deployment history.</p>
							<div className="text-sm text-primary-500">
								Actions show the available operations and recent activity for this package.
							</div>
						</div>
					) : (
						<McpActionsTable
							data={finalTransformedActions}
							pagination={(finalActionsData as any)?.pagination}
							onPageChange={(page) => setActionsPage(page)}
						/>
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
