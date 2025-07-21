import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";

export const Route = createFileRoute("/_hub/knowledge/browse")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="">
			<BrowseKnowledgeBase />
			<KnowledgeBaseListContainer />
		</div>
	);
}
