import { createFileRoute } from "@tanstack/react-router";
import HubLayout from "@/components/layouts/hub-layout";
import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import { McpListContainer } from "@/components/features/mcp-list/mcp-list-container";
import { CreditsMenu } from "@/components/credit-menu";
import { Wallet } from "@/components/wallet-connect";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <HubLayout>
      <main className="flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center min-h-[86px] border-b px-6">
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
        <McpListContainer />
      </main>
    </HubLayout>
  );
}
