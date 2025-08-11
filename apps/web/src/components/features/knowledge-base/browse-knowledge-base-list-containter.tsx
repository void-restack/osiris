import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrowseKnowledgeBaseList } from "./browse-knowledge-base-list";
import { KnowledgeBaseFilters } from "./knowlege-base-filters";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";
import type { KnowledgeBase } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { knowledgeQueries } from "@/lib/queries";
import { isAuthenticated } from "@/lib/auth-optimized";
import { useQueryState, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Link } from "@tanstack/react-router";
import { KnowledgeBaseGridSkeleton } from "./knowledge-base-card-skeleton";

type KnowledgeBaseListContainerProps = {
	showOnlyMyKBs?: boolean;
	showInstalled?: boolean;
};

export function KnowledgeBaseListContainer({
	showOnlyMyKBs = false,
	showInstalled = false
}: KnowledgeBaseListContainerProps) {
	const isMobile = useIsMobile()
	const navigate = useNavigate();
	const router = useRouter();
	const isAuth = isAuthenticated();
	
	// URL state management for filters
	const [search] = useQueryState("query", parseAsString.withDefault(""));
	const [page] = useQueryState("page", parseAsInteger.withDefault(1));
	const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
	const [sortBy] = useQueryState("sortBy", parseAsString.withDefault("recent"));
	const [sortOrder] = useQueryState("sortOrder", parseAsString.withDefault("desc"));
	const [isPublic] = useQueryState("isPublic", parseAsBoolean.withDefault(true));
	const [startPrice] = useQueryState("startPrice", parseAsInteger);
	const [endPrice] = useQueryState("endPrice", parseAsInteger);
	const [topK] = useQueryState("topK", parseAsInteger.withDefault(10));
	const [showOnlyMyKBsState] = useQueryState("showOnlyMyKBs", parseAsBoolean.withDefault(false));
	const [showInstalledState] = useQueryState("showInstalled", parseAsBoolean.withDefault(false));

	// Local state for filters
	const [selectedTag, setSelectedTag] = useState("all");
	const [permission, setPermission] = useState("all");

	// Build API filters from URL state
	const apiFilters = useMemo(() => {
		const filters: {
			query?: string;
			tags?: string;
			sortBy?: 'rating' | 'credits' | 'installs' | 'price' | 'recent';
			sortOrder?: 'asc' | 'desc';
			isPublic?: boolean;
			startPrice?: number;
			endPrice?: number;
			page: number;
			limit: number;
			topK: number;
		} = {
			page,
			limit,
			topK,
		};

		if (search) {
			filters.query = search;
		}

		if (sortBy && ['rating', 'credits', 'installs', 'price', 'recent'].includes(sortBy)) {
			filters.sortBy = sortBy as 'rating' | 'credits' | 'installs' | 'price' | 'recent';
		}

		if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
			filters.sortOrder = sortOrder as 'asc' | 'desc';
		}

		if (isPublic !== undefined) {
			filters.isPublic = isPublic;
		}

		if (startPrice) {
			filters.startPrice = startPrice;
		}

		if (endPrice) {
			filters.endPrice = endPrice;
		}

		return filters;
	}, [search, sortBy, sortOrder, isPublic, startPrice, endPrice, page, limit, topK]);

	// Fetch knowledge bases based on current filters
	const { data: knowledgeBaseData, isPending, isFetching } = useQuery({
		...knowledgeQueries.searchOptions(apiFilters),
		enabled: !showInstalledState, // Only fetch search data when not showing installed
		placeholderData: (previousData) => previousData,
	});

	// Fetch user's knowledge bases
	const { data: userKnowledgeBases } = useQuery({
		...knowledgeQueries.myOptions(),
		enabled: isAuth && showOnlyMyKBsState && !showInstalledState,
	});

	// Fetch installed knowledge bases
	const { data: installedKnowledgeBases } = useQuery({
		...knowledgeQueries.allInstalledOptions(),
		enabled: isAuth && showInstalledState,
	});

	// Fetch popular knowledge bases for autocomplete
	const { data: popularKnowledgeBases } = useSuspenseQuery(
		knowledgeQueries.basesOptions()
	);

	// Determine which data to show based on filters
	const knowledgeBases = useMemo(() => {
		if (showInstalledState && isAuth) {
			// Show installed knowledge bases
			return (installedKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
		} else if (showOnlyMyKBsState && isAuth) {
			// Show only user's knowledge bases
			return (userKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
		} else {
			// Show all knowledge bases based on search/filters
			if (!knowledgeBaseData?.data) return [];
			return knowledgeBaseData.data.map(normalizeKnowledgeBase);
		}
	}, [knowledgeBaseData, userKnowledgeBases, installedKnowledgeBases, showOnlyMyKBsState, showInstalledState, isAuth]);

	// Get all tags from the current data
	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		knowledgeBases.forEach((item: KnowledgeBase) => {
			item.tags.forEach((tag: string) => tagSet.add(tag));
		});
		return Array.from(tagSet);
	}, [knowledgeBases]);

	// Apply client-side filtering and sorting
	const filteredAndSorted = useMemo(() => {
		let data = [...knowledgeBases];

		// Apply tag filter (client-side since server doesn't handle this yet)
		if (selectedTag !== "all") {
			data = data.filter((item) => item.tags.includes(selectedTag));
		}

		// Apply sorting (client-side since server doesn't handle this yet)
		if (sortBy === "recent") {
			data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} else if (sortBy === "rating") {
			data = data.sort((a, b) => b.publicMetadata.rating - a.publicMetadata.rating);
		} else if (sortBy === "credits") {
			data = data.sort((a, b) => b.publicMetadata.price - a.publicMetadata.price);
		} else if (sortBy === "price") {
			data = data.sort((a, b) => b.publicMetadata.price - a.publicMetadata.price);
		} else if (sortBy === "installs") {
			data = data.sort((a, b) => b.publicMetadata.downloads - a.publicMetadata.downloads);
		}
		return data;
	}, [knowledgeBases, selectedTag, permission, sortBy]);

	// Search function for autocomplete (searches in all available data)
	const searchKnowledgeBases = (query: string) => {
		let allData: KnowledgeBase[] = [];
		
		if (showInstalledState && isAuth) {
			allData = (installedKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
		} else if (showOnlyMyKBsState && isAuth) {
			allData = (userKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
		} else {
			allData = (knowledgeBaseData?.data || []).map(normalizeKnowledgeBase);
		}

		const filtered = allData
			.filter((kb: KnowledgeBase) =>
				kb.name.toLowerCase().includes(query.toLowerCase()) ||
				(kb.description || '').toLowerCase().includes(query.toLowerCase()) ||
				(kb.tags || []).some((tag: string) =>
					tag.toLowerCase().includes(query.toLowerCase())
				)
			)
			.slice(0, 10);

		return filtered.map((kb: KnowledgeBase) => ({
			...kb,
			value: kb.knowledgeBaseId,
			label: kb.name,
			link: `/knowledge/${kb.knowledgeBaseId}` // Add link property for autocomplete
		}));
	};

	const normalizedPopularKnowledgeBases = useMemo(() => {
		return (popularKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
	}, [popularKnowledgeBases]);

	// Sync sortBy with filters when they change
	useEffect(() => {
		if (sortBy && sortBy !== sortBy) {
			// This will be handled by the URL state
		}
	}, [sortBy]);

	const totalResults = knowledgeBaseData?.pagination?.total ?? filteredAndSorted.length;
	const totalPages = knowledgeBaseData?.pagination?.totalPages ?? Math.ceil(filteredAndSorted.length / limit);
	const currentPage = page;

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

	const handleFilterChange = (newFilters: Partial<typeof apiFilters>) => {
		router.navigate({
			to: "/knowledge",
			search: {
				...router.state.location.search,
				...newFilters,
				page: 1,
			},
		});
	};

	const handleShowInstalledChange = (showInstalled: boolean) => {
		router.navigate({
			to: "/knowledge",
			search: {
				...router.state.location.search,
				showInstalled,
				page: 1, // Reset to first page
			},
		});
	};

	const handleResetAllFilters = () => {
		router.navigate({
			to: "/knowledge",
			search: {
				page: 1,
				limit: 10,
				topK: 10,
				sortBy: "recent",
				sortOrder: "desc",
				isPublic: true,
			},
		});
		// Reset local state
		setSelectedTag("all");
		setPermission("all");
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="h-12 md:h-[72px] px-4 md:px-6" />
			
			{/* Header */}
			<div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
				<h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
					Discover Knowledge Bases
				</h2>
				<span className="text-primary-300 text-sm">
					Browse and explore knowledge bases for AI applications
				</span>
			</div>

			{/* Search Autocomplete */}
			<div className="w-full px-4 mb-18 md:px-0">
				<Autocomplete
					className="mt-6"
					onSearch={searchKnowledgeBases}
					getItemValue={(item) => item.knowledgeBaseId}
					getItemLabel={(item) => item.name}
					emptyText="No knowledge bases found."
					footerText="Explore knowledge bases"
					bottomLeftContent={
						<div className="flex items-center gap-3">
							{normalizedPopularKnowledgeBases.slice(0, 3).map((kb: { knowledgeBaseId: string; name: string }) => (
								<Link to={`/knowledge/${kb.knowledgeBaseId}`} key={kb.knowledgeBaseId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
									{kb.name}
								</Link>
							))}
						</div>
					}
					bottomRightContent={<></>}
					popularItems={
						<div className="flex w-full gap-2">
							{normalizedPopularKnowledgeBases.slice(0, 3).map((kb: { knowledgeBaseId: string; name: string }) => (
								<Link to={`/knowledge/${kb.knowledgeBaseId}`} key={kb.knowledgeBaseId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
									{kb.name}
								</Link>
							))}
						</div>
					}
					renderItem={(item) => (
						<Link to={item.link || `/knowledge/${item.knowledgeBaseId}`} className="flex items-center space-x-2 w-full">
							{item.iconUrl ? (
								<img
									src={item.iconUrl}
									alt={item.name}
									className="size-4 rounded-md object-cover flex-shink-0"
								/>
							) : (
								<div className="size-4 rounded-md bg-blue-400 flex-shink-0" />
							)}
							<span className="flex-shink-0">{item.name}</span>
							<span className="flex-shink-0"> - </span>
							<span className="text-primary-400 truncate flex-1 min-w-0">{item.description || ''}</span>
						</Link>
					)}
					onSelect={(item) => {
						window.location.href = item.link || `/knowledge/${item.knowledgeBaseId}`;
					}}
				/>
			</div>

			<div className="flex w-full gap-4 md:items-center md:justify-between px-4 flex-col md:flex-row md:px-6">
				<h3 className="w-full font-medium text-[#171717] text-xl">
					{showInstalledState ? 'Installed Knowledge Bases' : 
					 showOnlyMyKBsState ? 'My Knowledge Bases' : 'All Knowledge Hubs'}
				</h3>
				<div className="flex w-max items-center justify-end gap-4">
					<KnowledgeBaseFilters
						tags={allTags}
						selectedTag={selectedTag}
						onTagChange={setSelectedTag}
						permission={permission}
						onPermissionChange={setPermission}
						sortBy={sortBy}
						onSortByChange={(sort) => handleFilterChange({ sortBy: sort as 'rating' | 'credits' | 'installs' | 'price' | 'recent' })}
						showOnlyMyKBs={showOnlyMyKBsState}
						onShowOnlyMyKBsChange={handleShowOnlyMyKBsChange}
						isPublic={apiFilters.isPublic}
						onIsPublicChange={(isPublic) => handleFilterChange({ isPublic })}
						startPrice={apiFilters.startPrice}
						onStartPriceChange={(startPrice) => handleFilterChange({ startPrice })}
						endPrice={apiFilters.endPrice}
						onEndPriceChange={(endPrice) => handleFilterChange({ endPrice })}
						topK={apiFilters.topK}
						onTopKChange={(topK) => handleFilterChange({ topK })}
						showInstalled={showInstalledState}
						onShowInstalledChange={handleShowInstalledChange}
						onReset={handleResetAllFilters}
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
			<ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto hidebar">
				<div className="mt-5 px-6 flex-1 flex flex-col min-h-0 mb-8 pb-32 hidebar">
					{isPending ? (
						<KnowledgeBaseGridSkeleton count={6} />
					) : (
						<BrowseKnowledgeBaseList cards={filteredAndSorted} />
					)}
					
					{/* Loading Spinner for Background Refetching */}
					{isFetching && !isPending && (
						<div className="flex justify-center items-center py-4">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
							<span className="ml-2 text-sm text-primary-600">Updating...</span>
						</div>
					)}
				</div>
			</ScrollArea>
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

// Helper function to normalize knowledge base data
function normalizeKnowledgeBase(kb: any): KnowledgeBase {
	// Handle new response structure with install, knowledge_base, and seller
	if (kb.install && kb.knowledge_base) {
		return {
			knowledgeBaseId: kb.knowledge_base.knowledgeBaseId,
			name: kb.knowledge_base.name,
			description: kb.knowledge_base.description,
			iconUrl: kb.knowledge_base.iconUrl,
			tags: kb.knowledge_base.tags || [],
			isPublic: kb.knowledge_base.isPublic,
			publicMetadata: {
				price: kb.knowledge_base.publicMetadata?.price || 0,
				downloads: kb.knowledge_base.publicMetadata?.downloads || 0,
				rating: kb.knowledge_base.publicMetadata?.rating || 0,
				ratingCount: kb.knowledge_base.publicMetadata?.ratingCount || 0,
			},
			userId: kb.knowledge_base.userId,
			coverImageUrl: kb.knowledge_base.coverImageUrl,
			createdAt: kb.knowledge_base.createdAt,
			updatedAt: kb.knowledge_base.updatedAt,
		};
	}

	// Handle response structure with knowledgeBase object
	if (kb.knowledgeBase) {
		return {
			knowledgeBaseId: kb.knowledgeBase.knowledgeBaseId,
			name: kb.knowledgeBase.name,
			description: kb.knowledgeBase.description,
			iconUrl: kb.knowledgeBase.iconUrl,
			tags: kb.knowledgeBase.tags || [],
			isPublic: kb.knowledgeBase.isPublic,
			publicMetadata: {
				price: kb.knowledgeBase.publicMetadata?.price || 0,
				downloads: kb.knowledgeBase.publicMetadata?.downloads || 0,
				rating: kb.knowledgeBase.publicMetadata?.rating || 0,
				ratingCount: kb.knowledgeBase.publicMetadata?.ratingCount || 0,
			},
			userId: kb.knowledgeBase.userId,
			coverImageUrl: kb.knowledgeBase.coverImageUrl,
			createdAt: kb.knowledgeBase.createdAt,
			updatedAt: kb.knowledgeBase.updatedAt,
		};
	}

	// Handle joined response structure (fallback)
	if (kb.knowledge_bases) {
		return {
			knowledgeBaseId: kb.knowledge_bases.knowledgeBaseId,
			name: kb.knowledge_bases.name,
			description: kb.knowledge_bases.description,
			iconUrl: kb.knowledge_bases.iconUrl,
			tags: kb.knowledge_bases.tags || [],
			isPublic: kb.knowledge_bases.isPublic,
			publicMetadata: {
				price: kb.knowledge_bases.publicMetadata?.price || 0,
				downloads: kb.knowledge_bases.publicMetadata?.downloads || 0,
				rating: kb.knowledge_base_ratings?.rating || kb.knowledge_bases.publicMetadata?.rating || 0,
				ratingCount: kb.knowledge_base_ratings?.ratingCount || kb.knowledge_bases.publicMetadata?.ratingCount || 0,
			},
			userId: kb.knowledge_bases.userId,
			coverImageUrl: kb.knowledge_bases.coverImageUrl,
			createdAt: kb.knowledge_bases.createdAt,
			updatedAt: kb.knowledge_bases.updatedAt,
		};
	}

	// Handle direct knowledge base object (fallback)
	return {
		knowledgeBaseId: kb.knowledgeBaseId,
		name: kb.name,
		description: kb.description,
		iconUrl: kb.iconUrl,
		tags: kb.tags || [],
		isPublic: kb.isPublic,
		publicMetadata: {
			price: kb.publicMetadata?.price || 0,
			downloads: kb.publicMetadata?.downloads || 0,
			rating: kb.publicMetadata?.rating || 0,
			ratingCount: kb.publicMetadata?.ratingCount || 0,
		},
		userId: kb.userId,
		coverImageUrl: kb.coverImageUrl,
		createdAt: kb.createdAt,
		updatedAt: kb.updatedAt,
	};
}
