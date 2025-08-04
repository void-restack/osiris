import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { KnowledgeBaseGridSkeleton } from "@/components/features/knowledge-base/knowledge-base-card-skeleton";
import { knowledgeQueries } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_hub/knowledge/")({
	component: RouteComponent,
	loader: async () => {
		return { breadcrumb: "Knowledge" };
	},
});

function RouteComponent() {
	const [showOnlyMyKBs, setShowOnlyMyKBs] = useState(false);

	// Conditional data fetching based on switch state
	const { data: allKBs, isLoading: allKBsLoading } = useQuery({
		...knowledgeQueries.basesOptions(),
		enabled: !showOnlyMyKBs,
	})
	
	const { data: myKBs, isLoading: myKBsLoading } = useQuery({
		...knowledgeQueries.myOptions(),
		enabled: showOnlyMyKBs,
	})

	const cards = showOnlyMyKBs ? (myKBs ?? []) : (allKBs ?? []);
	const isLoading = showOnlyMyKBs ? myKBsLoading : allKBsLoading;

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
					onShowOnlyMyKBsChange={setShowOnlyMyKBs}
				/>
			)}
		</div>
	)
}
