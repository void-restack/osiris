import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrowseKnowledgeBaseList } from "./browse-knowledge-base-list";
import { KnowledgeBaseFilters } from "./knowlege-base-filters";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";
import type { KnowledgeBase } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

type KnowledgeBaseListContainerProps = {
	cards: KnowledgeBase[];
	showOnlyMyKBs: boolean;
	filters: {
		search: string;
		page: number;
		limit: number;
	};
	pagination?: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
};

export function KnowledgeBaseListContainer({
	cards,
	showOnlyMyKBs,
	filters,
	pagination
}: KnowledgeBaseListContainerProps) {
	const isMobile = useIsMobile()
	const navigate = useNavigate();
	const router = useRouter();
	const [selectedTag, setSelectedTag] = useState("all");
	const [permission, setPermission] = useState("all");
	const [sortBy, setSortBy] = useState("latest");

	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		cards.forEach((item: KnowledgeBase) => {
			item.tags.forEach((tag: string) => tagSet.add(tag));
		});
		return Array.from(tagSet);
	}, [cards]);

	const filteredAndSorted = useMemo(() => {
		let data = [...cards];

		// Apply tag filter (client-side since server doesn't handle this yet)
		if (selectedTag !== "all") {
			data = data.filter((item) => item.tags.includes(selectedTag));
		}

		// Apply sorting (client-side since server doesn't handle this yet)
		if (sortBy === "latest") {
			data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} else if (sortBy === "stars") {
			data = data.sort((a, b) => b.publicMetadata.rating - a.publicMetadata.rating);
		} else if (sortBy === "credits") {
			data = data.sort((a, b) => b.publicMetadata.price - a.publicMetadata.price);
		}
		return data;
	}, [cards, selectedTag, permission, sortBy]);



	const totalResults = pagination?.total ?? filteredAndSorted.length;
	const totalPages = pagination?.totalPages ?? Math.ceil(filteredAndSorted.length / filters.limit);
	const currentPage = filters.page;

	const handlePageChange = (page: number) => {
		router.navigate({
			to: "/knowledge",
			search: {
				...router.state.location.search,
				page,
			},
		});
	};

	const handleShowOnlyMyKBsChange = (showOnly: boolean) => {
		router.navigate({
			to: "/knowledge",
			search: {
				...router.state.location.search,
				showOnlyMyKBs: showOnly,
				page: 1, // Reset to first page
			},
		});
	};

	const handleFilterChange = (newFilters: Partial<typeof filters>) => {
		router.navigate({
			to: "/knowledge",
			search: {
				...router.state.location.search,
				...newFilters,
				page: 1,
			},
		});
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="h-12 md:h-[72px] px-4 md:px-6" />
			<div className="flex w-full gap-4 md:items-center md:justify-between px-4 flex-col md:flex-row md:px-6">
				<h3 className="w-full font-medium text-[#171717] text-xl">
					All Knowledge Hubs
				</h3>
				<div className="flex w-max items-center justify-end gap-4">
					<KnowledgeBaseFilters
						tags={allTags}
						selectedTag={selectedTag}
						onTagChange={setSelectedTag}
						permission={permission}
						onPermissionChange={setPermission}
						sortBy={sortBy}
						onSortByChange={setSortBy}
						showOnlyMyKBs={showOnlyMyKBs}
						onShowOnlyMyKBsChange={handleShowOnlyMyKBsChange}
						searchQuery={filters.search}
						onSearchChange={(search) => handleFilterChange({ search })}
					/>
					<Button
						className="cursor-pointer"
						onClick={() => {
							navigate({
								to: "/knowledge/new",
							});
						}}
					>
						{isMobile ? (
							<Plus />
						) : (
							<>
								Create Knowledge Base
								<Plus />
							</>
						)}
					</Button>
				</div>
			</div>
			<Separator />
			<div className="mt-5 px-6 flex-1 flex flex-col min-h-0 mb-8">
				<BrowseKnowledgeBaseList cards={filteredAndSorted} />
			</div>
			<div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 py-6">
				<McpListPagination
					totalPages={totalPages}
					currentPage={currentPage}
					onPageChange={handlePageChange}
					totalResults={totalResults}
				/>
			</div>
		</div>
	);
}
