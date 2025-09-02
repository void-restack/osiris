import React from "react";
import { useAppStore } from "@/lib/store";
import { McpFilters } from "./mcp-filters";
import { McpListPagination } from "./mcp-list-pagination";
import { McpTable } from "./mcp-table";
import { McpViewToggle } from "./toggle-view";
import { PackagesGridView } from "../packages-table/packages-grid-view";

export function McpListContainer() {
    const { mcpView } = useAppStore();

    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 12;

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

    const totalResults = mockData.length;
    const totalPages = Math.ceil(totalResults / pageSize);
    const paginatedCards = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return mockData.slice(start, start + pageSize);
    }, [mockData, currentPage, pageSize]);

    // Adapt plain data to PackagesGridView expected shape: Row<PackageList>[]
    const gridRows = React.useMemo(() => {
        return paginatedCards.map((pkg, index) => ({ id: String(index), original: pkg } as any));
    }, [paginatedCards]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [mcpView]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex w-full items-start md:items-center justify-between border-b border-b-primary-100 px-4 md:px-6 py-4 font-medium text-xl flex-col md:flex-row gap-3">
                <h3 className="w-full font-medium text-[#171717] text-xl">All MCPs</h3>
                <div className="flex w-full md:w-max items-start md:items-center justify-end gap-2 flex-col md:flex-row">
                    <McpViewToggle />
                    <McpFilters />
                </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-auto">
                    <div className="px-4 md:px-6">
                        {mcpView === "directory" ? (
                            <PackagesGridView rows={gridRows} />
                        ) : (
                            <McpTable
                                data={mockData}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                </div>
                <div className="sticky bottom-0 flex w-full items-center overflow-hidden bg-primary-00 px-4 md:px-6 py-2 z-40">
                    <McpListPagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        totalResults={totalResults}
                    />
                </div>
            </div>
        </div>
    );
}
