import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { knowledgeQueries } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_hub/knowledge/browse")({
	component: RouteComponent,
	loader: async () => {
		return { breadcrumb: "Knowledge" };
	},
});

function RouteComponent() {
	const [showOnlyMyKBs, setShowOnlyMyKBs] = useState(false);

	// Conditional data fetching based on switch state
	const { data: allKBs } = useQuery({
		...knowledgeQueries.basesOptions(),
		enabled: !showOnlyMyKBs,
	});
	
	const { data: myKBs } = useQuery({
		...knowledgeQueries.myOptions(),
		enabled: showOnlyMyKBs,
	});

	const cards = showOnlyMyKBs ? (myKBs ?? []) : (allKBs ?? []);
	return (
		<div className="px-4 md:px-0">
			<BrowseKnowledgeBase />
			<KnowledgeBaseListContainer 
				cards={cards}
				showOnlyMyKBs={showOnlyMyKBs}
				onShowOnlyMyKBsChange={setShowOnlyMyKBs}
			/>
		</div>
	);
}
