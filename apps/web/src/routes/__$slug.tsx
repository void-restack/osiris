// import { createFileRoute } from "@tanstack/react-router";
// import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
// import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";
// import HubLayout from "@/components/layouts/hub-layout";
// import {
// 	Breadcrumb,
// 	BreadcrumbItem,
// 	BreadcrumbLink,
// 	BreadcrumbList,
// 	BreadcrumbPage,
// 	BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { Separator } from "@/components/ui/separator";
// import { SidebarTrigger } from "@/components/ui/sidebar";
//
// export const Route = createFileRoute("/$slug")({
// 	component: SlugComponent,
// });
//
// function SlugComponent() {
// 	const { slug } = Route.useParams();
//
// 	return (
// 		<HubLayout>
// 			<main className="flex h-full flex-col gap-4">
// 				<header className="flex h-[86px] shrink-0 items-center gap-2 border-b border-b-primary-100">
// 					<div className="flex items-center gap-2 px-4">
// 						<SidebarTrigger className="-ml-1" />
// 						<Separator
// 							orientation="vertical"
// 							className="mr-2 data-[orientation=vertical]:h-4"
// 						/>
// 						<Breadcrumb>
// 							<BreadcrumbList>
// 								<BreadcrumbItem className="hidden md:block">
// 									<BreadcrumbLink href="#">Discover MCPs</BreadcrumbLink>
// 								</BreadcrumbItem>
// 								<BreadcrumbSeparator className="hidden md:block" />
// 								<BreadcrumbItem>
// 									<BreadcrumbPage>Gmail MCP</BreadcrumbPage>
// 								</BreadcrumbItem>
// 							</BreadcrumbList>
// 						</Breadcrumb>
// 					</div>
// 				</header>
// 				<McpDetailsHeader />
// 				<McpTabs />
// 			</main>
// 		</HubLayout>
// 	);
// }
