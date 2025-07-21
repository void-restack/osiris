import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { BrowseKnowledgeBaseList } from "@/components/features/knowledge-base/browse-knowledge-base-list";
import { UnitsCard } from "@/components/features/knowledge-base/units-card";
import { UnitsCardsList } from "@/components/features/knowledge-base/units-list";

export const Route = createFileRoute("/_hub/knowledge/browse")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="">
			<BrowseKnowledgeBase />
			<UnitsCardsList />
		</div>
	);
}
