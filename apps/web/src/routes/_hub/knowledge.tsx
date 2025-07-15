import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBaseList } from "@/components/features/knowledge-base/browse-knowledge-base-list";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { KnowledgeBaseDetailsHeader } from "@/components/features/knowledge-base/knowledge-base-details-header";
import { UploadContent } from "@/components/features/knowledge-base/upload-contnet";

export const Route = createFileRoute("/_hub/knowledge")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col gap-y-6">
			<KnowledgeBaseDetailsHeader />
			<UploadContent />
			<KnowledgeBaseListContainer />
		</div>
	);
}
