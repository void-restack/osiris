import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { KnowledgeBaseGridSkeleton } from "@/components/features/knowledge-base/knowledge-base-card-skeleton";
import { knowledgeQueries } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const searchSchema = z.object({
	search: z.string().optional(),
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
	showOnlyMyKBs: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/_hub/knowledge/")({
	component: RouteComponent,
	validateSearch: searchSchema,
	loader: async () => {
		return { breadcrumb: "Knowledge" };
	},
});

function RouteComponent() {
	const search = Route.useSearch();
	const showOnlyMyKBs = search.showOnlyMyKBs ?? false;

	const filters = {
		search: search.search || "",
		page: search.page || 1,
		limit: search.limit || 6,
	};

	const { data: allKBsResponse, isLoading: allKBsLoading } = useQuery({
		...knowledgeQueries.basesOptions(filters),
		enabled: !showOnlyMyKBs,
	})

	const { data: myKBsResponse, isLoading: myKBsLoading } = useQuery({
		...knowledgeQueries.myOptions(filters),
		enabled: showOnlyMyKBs,
	})

	const activeResponse = showOnlyMyKBs ? myKBsResponse : allKBsResponse;
	const isLoading = showOnlyMyKBs ? myKBsLoading : allKBsLoading;

	let cards, pagination;

	console.log('Knowledge Base API Response:', activeResponse);

	if (activeResponse && 'pagination' in activeResponse) {
		cards = (activeResponse as any).data || [];
		pagination = (activeResponse as any).pagination;
	} else if (activeResponse?.data) {
		cards = Array.isArray(activeResponse.data) ? activeResponse.data : [];
		pagination = undefined;
	} else {
		cards = [];
		pagination = undefined;
	}


	return (
		<div className="px-4 md:px-0">
			<BrowseKnowledgeBase />
			{isLoading ? (
				<div className="flex min-h-0 flex-1 flex-col gap-3">
					<div className="h-12 md:h-[72px] px-4 md:px-6" />
					<div className="flex w-full gap-4 md:items-center md:justify-between px-4 flex-col md:flex-row md:px-6">
						<h3 className="w-full font-medium text-[#171717] text-xl">
							All Knowledge Hubs
						</h3>
					</div>
					<div className="mt-5 px-6 flex-1 flex flex-col min-h-0 mb-8">
						<KnowledgeBaseGridSkeleton count={6} />
					</div>
				</div>
			) : (
				<KnowledgeBaseListContainer
					cards={cards}
					showOnlyMyKBs={showOnlyMyKBs}
					filters={filters}
					pagination={pagination}
				/>
			)}
		</div>
	)
}
