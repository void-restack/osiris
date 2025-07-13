import { createFileRoute } from "@tanstack/react-router";
import { McpDetailsHeader } from "@/components/features/mcp-details/details-header";
import { McpTabs } from "@/components/features/mcp-details/mcp-details-tab";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/hub/mcp/$mcpId")({
	component: SlugComponent,
});

function SlugComponent() {
	const { slug } = Route.useParams();

	return (
		<main className="flex h-full flex-col gap-4">
			<McpDetailsHeader />
			<McpTabs />
		</main>
	);
}
