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
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4 font-medium text-xl">
				<h3 className="w-full font-medium text-[#171717] text-xl">All MCPs</h3>
				<div className="flex w-max items-center justify-end gap-2">
					<McpViewToggle />
					<McpFilters />
				</div>
			</div>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="flex-1 overflow-auto">
					<div className="px-6">
						{mcpView === "directory" ? (
							<McpCardList cards={mockData} />
						) : (
							<McpTable data={mockData} />
						)}
					</div>
				</div>
				<div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 py-6">
					<McpListPagination
						totalPages={10}
						currentPage={1}
						onPageChange={() => {}}
						resultsPerPage={10}
						totalResults={100}
					/>
				</div>
			</div>
		</div>
	);
}
