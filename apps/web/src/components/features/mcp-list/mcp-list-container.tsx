import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { McpCardList } from "./mcp-card-list";
import { McpFilters } from "./mcp-filters";
import { McpListPagination } from "./mcp-list-pagination";
import { McpTable } from "./mcp-table";
import { McpViewToggle } from "./toggle-view";

export function McpListContainer() {
	const { mcpView } = useAppStore();

	const mockData = [
		{
			title: "Memory tool",
			description:
				"Store and retrieve user-specific memories to maintain context and make informed decisions based on past interactions",
			tags: [
				{
					tag: "Assistant",
					icon: "/test/user.svg",
				},
				{
					tag: "Free",
				},
			],
			icon: "/test/mem.svg",
			userHandle: "@mem0ai/mem0-memory-mcp",
			isVerified: true,
			credits: "FREE" as const,
		},
		{
			title: "Email Assistant",
			description: "Send and manage emails with AI assistance",
			tags: [
				{
					tag: "Assistant",
					icon: "/test/user.svg",
				},
				{
					tag: "Free",
				},
			],
			icon: "/test/gmail.svg",
			userHandle: "@emailai/email-assistant-mcp",
			isVerified: true,
			credits: 100,
		},
		{
			title: "Calendar Manager",
			description: "Manage your calendar and schedule meetings efficiently",
			tags: [
				{
					tag: "Productivity",
				},
				{
					tag: "Premium",
				},
			],
			icon: "/test/calander.svg",
			userHandle: "@calendartech/calendar-mcp",
			isVerified: false,
			credits: 100,
		},
	];

	return (
		<div className="flex h-full flex-col gap-4">
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
				{mcpView === "directory" ? (
					<McpCardList cards={mockData} />
				) : (
					<McpTable data={mockData} />
				)}
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
