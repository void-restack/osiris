import { Separator } from "@/components/ui/separator";
import { McpFilters } from "./mcp-filters";
import { McpCardList } from "./mcp-card-list";
import { McpViewToggle } from "./toggle-view";
import { McpListPagination } from "./mcp-list-pagination";

export function McpListContainer() {
  return (
    <div className="flex flex-col gap-4 h-full relative">
      <div className="h-[72px] px-6"></div>
      <div className="flex justify-between items-center px-6 w-full">
        <h3 className="text-xl font-medium text-[#171717] w-full">All MCPs</h3>
        <div className="flex items-center justify-end  gap-2 w-max">
        <McpViewToggle />
        <McpFilters />
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-4 px-6">
        <McpCardList
          cards={[
            {
              title: "MCP 1",
              description: "MCP 1 description",
              tags: [
                {
                  tag: "tag1",
                },
                {
                  tag: "tag2",
                },
              ],
              icon: "/logo.svg",
              userHandle: "user1",
              isVerified: true,
            },
            {
              title: "MCP 2",
              description: "MCP 2 description",
              tags: [
                {
                  tag: "tag1",
                },
                {
                  tag: "tag2",
                },
              ],
              icon: "/logo.svg",
              userHandle: "user1",
              isVerified: true,
            },
          ]}
        />
      </div>
        <McpListPagination
            totalPages={10}
            currentPage={1}
            onPageChange={() => {}}
            resultsPerPage={10}
            totalResults={100}
        />
    </div>
  );
}