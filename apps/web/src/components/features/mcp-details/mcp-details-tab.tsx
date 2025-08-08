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
import { isAuthenticated } from "@/lib/auth-optimized";
import { ToolCaseIcon } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useState } from "react";

export function McpTabs() {
	const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
	const authenticated = isAuthenticated();
	const [serversPage, setServersPage] = useState(1);
	const [actionsPage, setActionsPage] = useState(1);

	const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(mcpId));
	const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(mcpId));

	const { data: actionsData } = useQuery({
		...packageQueries.actionsOptions(mcpId, authenticated, { page: actionsPage, limit: 5 }),
		enabled: authenticated,
		placeholderData: (previousData) => previousData, // Keep previous data while loading new data
	});

	const { data: serversData } = useQuery({
		...packageQueries.userDeploymentsForPackageOptions(mcpId, { page: serversPage, limit: 5 }),
		enabled: authenticated,
		placeholderData: (previousData) => previousData, // Keep previous data while loading new data
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

	// Transform actions data for the new table
	const transformedActions = actionsData?.data?.map((action: any) => ({
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

	// Temporary mock data for testing if API is not working
	const mockActionsData = {
		status: "SUCCESS",
		data: [
			{
				mcp_actions: {
					actionId: "test-action-1",
					deploymentId: "test-deployment-1",
					userId: "test-user-1",
					connectionId: "test-connection-1",
					actionType: "test-action-type",
					request: { test: "request" },
					response: { test: "response" },
					status: "success",
					errorMessage: null,
					createdAt: "2025-01-08T13:44:50.000Z",
					updatedAt: "2025-01-08T13:44:50.000Z",
				}
			}
		],
		pagination: {
			total: 1,
			totalPages: 1,
			page: 1,
			limit: 10
		}
	};

	// Use mock data if actionsData is not available
	const finalActionsData = actionsData || mockActionsData;

	const finalTransformedActions = finalActionsData?.data?.map((action: any) => ({
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

	// Transform servers data for the new table
	const transformedServers = serversData?.data || [];

	// this is how actionsData looks like
	/**
	 * 
	 * {
	"status": "SUCCESS",
	"data": [
		{
			"mcp_actions": {
				"actionId": "8e7c79b9-be9c-411e-b1d4-5dd1f001e816",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0xdffe76fffe5dac56e134b0c9af49e19ec22f521f7e8ea92bd1df47b119b259e9"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753176254972,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 0,
										"b": true,
										"c": "btc_long_market_11",
										"p": "43800",
										"r": false,
										"s": "11",
										"t": {
											"limit": {
												"tif": "Gtc"
											}
										}
									}
								],
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "89fc1b4d1d05192084e4f2fd4aa1afa8e6f908ffefa6a75d7527636759cf45ad",
							"s": "223454c824b647b7e477af924e9c7c4f5081862275bcc2ed5a0fbbba3395f4cb",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0xdffe76fffe5dac56e134b0c9af49e19ec22f521f7e8ea92bd1df47b119b259e9"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T09:24:15.222Z",
				"updatedAt": "2025-07-22T09:24:15.222Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "07ad11a8-40a5-48e1-bfaf-74ef887d78c2",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0xeeb12d41899667ea4e179d61b9b87fe99037ee75d9e488e453e4e15bf8915794"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753176291300,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 0,
										"b": true,
										"p": "118080.5",
										"r": false,
										"s": "0.000093157",
										"t": {
											"limit": {
												"tif": "Gtc"
											}
										}
									}
								],
								"builder": {
									"b": "0x0000000000000000000000000000000000000000",
									"f": 0
								},
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "e2f94b05d525de8306999652fec001c7c4c72f00de38da6efa90145f61f302a9",
							"s": "42d08c4a94d165eb98cd3ebd04897fc81a1c01aea2a0b79c4cc47d313e31822b",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0xeeb12d41899667ea4e179d61b9b87fe99037ee75d9e488e453e4e15bf8915794"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T09:24:51.431Z",
				"updatedAt": "2025-07-22T09:24:51.431Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "c085aa18-34cc-4d5e-901e-ebb2c96fe057",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0x492082338c1284c240fcedee0bab4ba28176a4201c6cfcf2d920cc4509a8bc6b"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753179065819,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 1,
										"b": true,
										"p": "3670",
										"r": false,
										"s": "0.0001",
										"t": {
											"limit": {
												"tif": "Gtc"
											}
										}
									}
								],
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "a8fca9116eb6b756e4b1e889a97fe186108a8d242fed8d7ff874f9e89bc410cc",
							"s": "4a399ec5b6bb729ddcf39e6c791186b4eda3149df6b2519eb555bb048a3c1876",
							"v": "01"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0x492082338c1284c240fcedee0bab4ba28176a4201c6cfcf2d920cc4509a8bc6b"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T10:11:05.911Z",
				"updatedAt": "2025-07-22T10:11:05.911Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "e9f48c89-f58a-4b75-baa0-dd962fd44c26",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0x8df3e2436d0e2390b4916062eb9610ccfb273fdb81e64ccc05231fb09ccf238d"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753176459457,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 0,
										"b": false,
										"p": "118200",
										"r": true,
										"s": "0.0002",
										"t": {
											"limit": {
												"tif": "Ioc"
											}
										}
									}
								],
								"builder": {
									"b": "0x0000000000000000000000000000000000000000",
									"f": 0
								},
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "db3f27c2fdfb6fd71ac8f35094719d81affbaea80b039a72bc9eda905067aadf",
							"s": "6001dbea27106de6d799a230122286e189c06ebeea7283a24e4c44f114ba02fe",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0x8df3e2436d0e2390b4916062eb9610ccfb273fdb81e64ccc05231fb09ccf238d"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T09:27:39.585Z",
				"updatedAt": "2025-07-22T09:27:39.585Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "632388fc-a4a0-423f-aed1-a6c35799df35",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0x63f4efdd959577958f9c5e64b8b1815ff2dafd1f4155858e0bb51e43bb45f227"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753178889769,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 1,
										"b": true,
										"c": "eth_long_1",
										"p": "3670",
										"r": false,
										"s": "0.0001",
										"t": {
											"limit": {
												"tif": "Gtc"
											}
										}
									}
								],
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "780d307c19310b9f341e9ff2f35fa50867d917f2010878793cff6353c4e6961f",
							"s": "6d5e329c32a9f3f3d46b46aaf34f39d47608af507bb6aded3f3c6654cc27b259",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0x63f4efdd959577958f9c5e64b8b1815ff2dafd1f4155858e0bb51e43bb45f227"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T10:08:09.885Z",
				"updatedAt": "2025-07-22T10:08:09.885Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "5a9a88fc-b7ba-4867-8f74-63fb6982fd20",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0x98a175ddc938cf3f78c738691468a04b27dc5b8c70dc6aac3459b0e6d5f50dae"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753178949530,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 1,
										"b": true,
										"p": "3670",
										"r": false,
										"s": "0.0001",
										"t": {
											"limit": {
												"tif": "Gtc"
											}
										}
									}
								],
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "7286961f2f78ad753f818d1639c1f78d101d3dd3bee3cc46ab1a2ef0ce8f4e02",
							"s": "6b460f65df934e3b4160493660203e40ae70d9857f24cb5b6555adcde81d55e5",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0x98a175ddc938cf3f78c738691468a04b27dc5b8c70dc6aac3459b0e6d5f50dae"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T10:09:09.642Z",
				"updatedAt": "2025-07-22T10:09:09.642Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "d10563b3-cc1d-4b7c-b859-b82df987cd0c",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0x6d1969ea7112a36de4917ad483e67eb81363f2c30a5e60c3d7e527cafd260ffe"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753179044683,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 1,
										"b": true,
										"p": "3670",
										"r": false,
										"s": "0.0001",
										"t": {
											"limit": {
												"tif": "Gtc"
											}
										}
									}
								],
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "b4e26807cd160f6f06d6b072d8e63cd976877fca85f59b449f1431a210d131d4",
							"s": "050800fb46b4fcc70839e1c54da329cf8863db1a2233e73780b073705bff5158",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0x6d1969ea7112a36de4917ad483e67eb81363f2c30a5e60c3d7e527cafd260ffe"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T10:10:44.789Z",
				"updatedAt": "2025-07-22T10:10:44.789Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "46fc6849-fbf5-47ef-ab2b-a0ad983cdd77",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0xf5ce37560c8bef189fb703490a5eb947cd601e021ab8987adc5d14038f9d8f90"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753176299153,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 0,
										"b": true,
										"p": "118080.5",
										"r": false,
										"s": "0.000093",
										"t": {
											"limit": {
												"tif": "Ioc"
											}
										}
									}
								],
								"builder": {
									"b": "0x0000000000000000000000000000000000000000",
									"f": 0
								},
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "822dbd02230cf1bb669bac88720df31f88a34701f7993e875e15b35a5e70bbd2",
							"s": "3bda68de40a91afa3345d85e0730e023edb48b472166504cde7fb17b9de34b03",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0xf5ce37560c8bef189fb703490a5eb947cd601e021ab8987adc5d14038f9d8f90"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T09:24:59.306Z",
				"updatedAt": "2025-07-22T09:24:59.306Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "8ce9ecd0-cd72-49d1-8085-be695dc9c04d",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0xd591e282fe1b58d8673d62c06fcdeda8f37438dc87054a3dc7356d41b085fb36"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753176306873,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 0,
										"b": true,
										"p": "118080.5",
										"r": false,
										"s": "0.001",
										"t": {
											"limit": {
												"tif": "Ioc"
											}
										}
									}
								],
								"builder": {
									"b": "0x0000000000000000000000000000000000000000",
									"f": 0
								},
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "9007012f865b3a81f8dc8ba7a2a87cc13ac826d0095d646d03c7d21bb8802737",
							"s": "43f031ef16e9774cf081814324f88e14a53d1c8d2fb54f330b22e11878166f2c",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0xd591e282fe1b58d8673d62c06fcdeda8f37438dc87054a3dc7356d41b085fb36"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T09:25:06.977Z",
				"updatedAt": "2025-07-22T09:25:06.977Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		},
		{
			"mcp_actions": {
				"actionId": "4f3ec6f4-d750-47a3-92ed-45e1f9a1d88c",
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"connectionId": "6a3429c6-1a1a-4713-8a90-ad87ec87977c",
				"actionType": "",
				"request": {
					"url": "",
					"data": {
						"chain": "evm:eip155:999",
						"method": "signTypedData",
						"payload": [
							{
								"types": {
									"Agent": [
										{
											"name": "source",
											"type": "string"
										},
										{
											"name": "connectionId",
											"type": "bytes32"
										}
									]
								},
								"domain": {
									"name": "Exchange",
									"chainId": 1337,
									"version": "1",
									"verifyingContract": "0x0000000000000000000000000000000000000000"
								},
								"message": {
									"source": "a",
									"connectionId": "0x8e0bbd2aeb414a45e8733ecbd72510d93a51a8cd7349e6a8c90e8b1b92662133"
								},
								"primaryType": "Agent"
							}
						],
						"metadata": {
							"nonce": 1753176315536,
							"isTestnet": false,
							"operation": "leveragePerpTrade",
							"rawAction": {
								"type": "order",
								"orders": [
									{
										"a": 0,
										"b": true,
										"p": "118100",
										"r": false,
										"s": "0.001",
										"t": {
											"limit": {
												"tif": "Ioc"
											}
										}
									}
								],
								"builder": {
									"b": "0x0000000000000000000000000000000000000000",
									"f": 0
								},
								"grouping": "na"
							},
							"ordersCount": 1
						},
						"walletAddress": "0x3b724D8078fDDf47b0fAeE9d6Be2800d6BF3b575"
					},
					"method": "POST",
					"service": "turnkey"
				},
				"response": {
					"signatures": [
						{
							"r": "d27dafa1c6969f889453b1938f04a02c9ec524c40deec28bbeb53fb0ceff5dbf",
							"s": "61ddd9631230324da6f7b246752b3287a8922753ef2f1fe8842d997285f59f16",
							"v": "00"
						}
					],
					"originalTypedData": {
						"types": {
							"Agent": [
								{
									"name": "source",
									"type": "string"
								},
								{
									"name": "connectionId",
									"type": "bytes32"
								}
							]
						},
						"domain": {
							"name": "Exchange",
							"chainId": 1337,
							"version": "1",
							"verifyingContract": "0x0000000000000000000000000000000000000000"
						},
						"message": {
							"source": "a",
							"connectionId": "0x8e0bbd2aeb414a45e8733ecbd72510d93a51a8cd7349e6a8c90e8b1b92662133"
						},
						"primaryType": "Agent"
					}
				},
				"status": "success",
				"errorMessage": null,
				"createdAt": "2025-07-22T09:25:15.678Z",
				"updatedAt": "2025-07-22T09:25:15.678Z"
			},
			"mcp_deployments": {
				"deploymentId": "1771b432-8fef-4d50-a900-24b3a2ade769",
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"url": "http://localhost:3000",
				"scopes": [
					"osiris:auth:action",
					"osiris:auth:read"
				],
				"authData": {},
				"status": "active",
				"embedding": null,
				"name": null,
				"createdAt": "2025-07-22T09:19:32.510Z",
				"updatedAt": "2025-07-22T09:19:32.510Z"
			},
			"user_installed_mcps": {
				"userMcpId": "c71c849d-2177-46c7-975d-f24204e815fa",
				"userId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
				"packageId": "67d42166-c5f7-4899-bff8-4ca2d3380f6f",
				"version": "1.0.0",
				"embedding": null,
				"installedAt": "2025-07-22T09:14:49.583Z",
				"updatedAt": "2025-07-22T09:14:49.583Z"
			}
		}
	],
	"pagination": {
		"total": 30,
		"totalPages": 3,
		"page": 1,
		"limit": 10
	}
}
	 */

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
							<div className="bg-white rounded-lg border border-primary-100 p-6">
								<MarkdownRenderer
									content={packageData.description}
								/>
							</div>
						) : (
							<div className="text-primary-600 text-center py-12 bg-primary-25 rounded-lg border border-primary-100">
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
					{!authenticated ? (
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
					{!authenticated ? (
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
