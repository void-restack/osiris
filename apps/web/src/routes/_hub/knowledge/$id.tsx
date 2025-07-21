import { KnowledgeBaseDetailsHeader } from "@/components/features/knowledge-base/knowledge-base-details-header";
import { KnowledgeHubTabs } from "@/components/features/knowledge-base/knowledge-base-tabs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_hub/knowledge/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div className="w-full flex flex-col gap-y-[56px]">
		<KnowledgeBaseDetailsHeader />
		<KnowledgeHubTabs />
  </div>;
}
