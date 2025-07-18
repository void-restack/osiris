import { createFileRoute } from "@tanstack/react-router";
import { CreateNewKnowledgeBase } from "@/components/features/knowledge-base/create-new-knowledge-base";

export const Route = createFileRoute("/_hub/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<CreateNewKnowledgeBase />
		</div>
	);
}
