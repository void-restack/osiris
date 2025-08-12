
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import type { KnowledgeBase } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { knowledgeQueries } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { useQueryState, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Link } from "@tanstack/react-router";
import { KnowledgeBaseTable } from "./knowledge-base-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

export function KnowledgeBaseListContainer({
	setKnowledgeBaseTable
}: {
	setKnowledgeBaseTable: (table: any) => void;
}) {
	const isMobile = useIsMobile()
	const navigate = useNavigate();
	const router = useRouter();
	const { isAuthenticated } = useAuth();

	// URL state management for filters
	const [search] = useQueryState("query", parseAsString.withDefault(""));

	const [showOnlyMyKBsState] = useQueryState("showOnlyMyKBs", parseAsBoolean.withDefault(false));
	const [showInstalledState] = useQueryState("showInstalled", parseAsBoolean.withDefault(false));



	const { data: knowledgeBaseData, isPending, isFetching } = useQuery({
		...knowledgeQueries.searchOptions({
			query: search,
		}),
		enabled: !showInstalledState, // Only fetch search data when not showing installed
		placeholderData: (previousData) => previousData,
	});

	// Fetch user's knowledge bases
	const { data: userKnowledgeBases } = useQuery({
		...knowledgeQueries.myOptions(),
		enabled: isAuthenticated && showOnlyMyKBsState && !showInstalledState,
	});

	// Fetch installed knowledge bases
	const { data: installedKnowledgeBases } = useQuery({
		...knowledgeQueries.allInstalledOptions(),
		enabled: isAuthenticated && showInstalledState,
	});

	// Fetch popular knowledge bases for autocomplete
	const { data: popularKnowledgeBases } = useSuspenseQuery(
		knowledgeQueries.basesOptions()
	);

	const searchKnowledgeBases = (query: string) => {
		let allData: KnowledgeBase[] = [];

		if (showInstalledState && isAuthenticated) {
			allData = (installedKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
		} else if (showOnlyMyKBsState && isAuthenticated) {
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
			<KnowledgeBaseTable onTableReady={(table) => {
				setKnowledgeBaseTable(table);
			}} />
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
