import { useMemo } from "react";
import type { KnowledgeBase } from "@/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { knowledgeQueries } from "@/lib/queries";
import { useQueryState, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Link } from "@tanstack/react-router";
import { KnowledgeBaseTable } from "./knowledge-base-table";

export function KnowledgeBaseListContainer({
	setKnowledgeBaseTable
}: {
	setKnowledgeBaseTable: (table: any) => void;
}) {
	// URL state management for filters
	const [search, setSearch] = useQueryState("query", parseAsString.withDefault(""));
	const [showInstalledState] = useQueryState("showInstalled", parseAsBoolean.withDefault(false));



	const { data: knowledgeBaseData, isPending, isFetching } = useQuery({
		...knowledgeQueries.searchOptions({
			query: search,
		}),
		enabled: !showInstalledState, // Only fetch search data when not showing installed
		placeholderData: (previousData) => previousData,
	});


	const { data: popularKnowledgeBases } = useSuspenseQuery(
		knowledgeQueries.basesOptions()
	);

	const searchKnowledgeBases = (query: string) => {
		setSearch(query);
		return groupedSearchResults.map(group => ({
			value: group.knowledgeBase.knowledgeBaseId,
			label: group.knowledgeBase.name,
			...group
		}));
	};

	// Group search results by knowledge base ID
	const groupedSearchResults = useMemo(() => {
		if (!knowledgeBaseData?.data) return [];
		
		const grouped = new Map<string, {
			knowledgeBase: any;
			units: any[];
		}>();
		
		knowledgeBaseData.data.forEach((result: any) => {
			const kbId = result.knowledge_bases?.knowledgeBaseId;
			if (!kbId) return;
			
			if (!grouped.has(kbId)) {
				grouped.set(kbId, {
					knowledgeBase: result.knowledge_bases,
					units: []
				});
			}
			grouped.get(kbId)!.units.push(result);
		});
		
		return Array.from(grouped.values());
	}, [knowledgeBaseData?.data]);

	const normalizedPopularKnowledgeBases = useMemo(() => {
		return (popularKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
	}, [popularKnowledgeBases]);




	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
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
					getItemValue={(item) => item.value}
					getItemLabel={(item) => item.label}
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
						<div className="w-full">
							{/* Knowledge Base Header */}
							<div className="flex items-center space-x-2 mb-2">
								{item.knowledgeBase.iconUrl ? (
									<img
										src={item.knowledgeBase.iconUrl}
										alt={item.knowledgeBase.name}
										className="size-4 rounded-md object-cover flex-shrink-0"
									/>
								) : (
									<div className="size-4 rounded-md bg-blue-400 flex-shrink-0" />
								)}
								<span className="flex-shrink-0 font-medium">{item.knowledgeBase.name}</span>
								<span className="flex-shrink-0 text-gray-500">-</span>
								<span className="text-primary-400 truncate flex-1 min-w-0">{item.knowledgeBase.description || ''}</span>
							</div>
							
							{/* Units Preview
							<div className="ml-6 space-y-1">
								{item.units.slice(0, 2).map((unit: any, index: number) => (
									<div key={index} className="text-sm">
										<span className="font-medium text-gray-700">{unit.name}</span>
										<span className="text-gray-500 ml-2">({unit.score.toFixed(3)})</span>
										<p className="text-gray-600 text-xs truncate">{unit.content}</p>
									</div>
								))}
								{item.units.length > 2 && (
									<div className="text-xs text-gray-500">
										+{item.units.length - 2} more units
									</div>
								)}
							</div> */}
						</div>
					)}
					onSelect={(item) => {
						window.location.href = `/knowledge/${item.value}`;
					}}
				/>
			</div>
			
			{/* Knowledge Base Table */}
			<KnowledgeBaseTable onTableReady={(table) => {
				setKnowledgeBaseTable(table);
			}} />
		</div>
	);
}

function normalizeKnowledgeBase(kb: any): KnowledgeBase {
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
