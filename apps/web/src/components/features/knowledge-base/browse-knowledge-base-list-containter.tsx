import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrowseKnowledgeBaseList } from "./browse-knowledge-base-list";
import { KnowledgeBaseFilters } from "./knowlege-base-filters";
import { useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";
import type { KnowledgeBase } from "@/types";

export function KnowledgeBaseListContainer({ cards }: { cards: KnowledgeBase[] }) {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedTag, setSelectedTag] = useState("all");
	const [permission, setPermission] = useState("all");
	const [sortBy, setSortBy] = useState("latest");
	const pageSize = 6;

	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		cards.forEach((item) => {
			item.tags.forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet);
	}, []);

	const filteredAndSorted = useMemo(() => {
		let data = [...cards];
		if (selectedTag !== "all") {
			data = data.filter((item) => item.tags.includes(selectedTag));
		}
		if (sortBy === "latest") {
			data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} else if (sortBy === "price") {
			data = data.sort((a, b) => b.publicMetadata.price - a.publicMetadata.price);
		}
		return data;
	}, [selectedTag, permission, sortBy]);

	const totalResults = filteredAndSorted.length;
	const totalPages = Math.ceil(totalResults / pageSize);
	const paginatedCards = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredAndSorted.slice(start, start + pageSize);
	}, [filteredAndSorted, currentPage, pageSize]);

	useMemo(() => {
		setCurrentPage(1);
	}, [selectedTag, permission, sortBy]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="h-[72px] px-6" />
			<div className="flex w-full items-center justify-between px-6">
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
					/>
					<Button
					className="cursor-pointer"
						onClick={() => {
							navigate({
								to: "/knowledge/new",
							});
						}}
					>
						Create Knowledge Base
						<Plus />
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
