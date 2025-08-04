import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrowseKnowledgeBaseList } from "./browse-knowledge-base-list";
import { KnowledgeBaseFilters } from "./knowlege-base-filters";
import { useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";
import type { KnowledgeBase } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

type KnowledgeBaseListContainerProps = {
	cards: KnowledgeBase[];
	showOnlyMyKBs: boolean;
	onShowOnlyMyKBsChange: (showOnly: boolean) => void;
};

export function KnowledgeBaseListContainer({ 
	cards, 
	showOnlyMyKBs, 
	onShowOnlyMyKBsChange 
}: KnowledgeBaseListContainerProps) {
	const isMobile = useIsMobile()
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedTag, setSelectedTag] = useState("all");
	const [permission, setPermission] = useState("all");
	const [sortBy, setSortBy] = useState("latest");
	const pageSize = 6;

	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		cards.forEach((item: KnowledgeBase) => {
			item.tags.forEach((tag: string) => tagSet.add(tag));
		});
		return Array.from(tagSet);
	}, [cards]);

	const filteredAndSorted = useMemo(() => {
		let data = [...cards];
		if (selectedTag !== "all") {
			data = data.filter((item) => item.tags.includes(selectedTag));
		}
		if (sortBy === "latest") {
			data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} else if (sortBy === "stars") {
			data = data.sort((a, b) => b.publicMetadata.rating - a.publicMetadata.rating);
		} else if (sortBy === "credits") {
			data = data.sort((a, b) => b.publicMetadata.price - a.publicMetadata.price);
		}
		return data;
	}, [cards, selectedTag, permission, sortBy]);

	const totalResults = filteredAndSorted.length;
	const totalPages = Math.ceil(totalResults / pageSize);
	const paginatedCards = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredAndSorted.slice(start, start + pageSize);
	}, [filteredAndSorted, currentPage, pageSize]);

	useMemo(() => {
		setCurrentPage(1);
	}, [selectedTag, permission, sortBy, showOnlyMyKBs]);

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
						onShowOnlyMyKBsChange={onShowOnlyMyKBsChange}
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
				<BrowseKnowledgeBaseList cards={paginatedCards} />
			</div>
			<div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 py-6">
				<McpListPagination
					totalPages={totalPages}
					currentPage={currentPage}
					onPageChange={setCurrentPage}
					totalResults={totalResults}
				/>
			</div>
		</div>
	);
}
