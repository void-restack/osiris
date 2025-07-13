import { createFileRoute } from "@tanstack/react-router";
import { CreditsMenu } from "@/components/credit-menu";
import { McpListContainer } from "@/components/features/mcp-list/mcp-list-container";
import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import HubLayout from "@/components/layouts/hub-layout";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Wallet } from "@/components/wallet-connect";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<HubLayout>
			<main className="flex h-full flex-col">
				<div className="flex min-h-[86px] items-center justify-between border-b px-6">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<h1>Discover Mcps</h1>
					</div>
					<div className="flex items-center gap-2">
						<Wallet />
						<CreditsMenu credits={100} />
					</div>
				</div>
				<McpSearchBox />
				<div className="h-4" />
				<McpListContainer />
			</main>
		</HubLayout>
	);
}
