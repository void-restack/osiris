import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { KnowledgeBaseDetailsHeader } from "@/components/features/knowledge-base/knowledge-base-details-header";
import { UploadContent } from "@/components/features/knowledge-base/upload-contnet";

export const Route = createFileRoute("/hub/knowledge")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col gap-y-6">
			<KnowledgeBaseDetailsHeader />
			<UploadContent />
			<BrowseKnowledgeBase />
		</div>
	);
}
