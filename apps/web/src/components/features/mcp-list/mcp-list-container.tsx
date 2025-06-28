import { Separator } from "@/components/ui/separator";
import { McpCardList } from "./mcp-card-list";
import { McpFilters } from "./mcp-filters";
import { McpListPagination } from "./mcp-list-pagination";
import { McpViewToggle } from "./toggle-view";

export function McpListContainer() {
	return (
		<div className="relative flex h-full flex-col gap-4">
			<div className="h-[72px] px-6" />
			<div className="flex w-full items-center justify-between px-6">
				<h3 className="w-full font-medium text-[#171717] text-xl">All MCPs</h3>
				<div className="flex w-max items-center justify-end gap-2">
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
