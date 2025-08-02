import { createFileRoute } from "@tanstack/react-router";
import { BrowseKnowledgeBase } from "@/components/features/knowledge-base/browse-knowledge-base";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { knowledgeQueries, userQueries } from "@/lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_hub/knowledge/browse")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(knowledgeQueries.basesOptions());
		await queryClient.ensureQueryData(userQueries.meOptions());
		return { breadcrumb: "Knowledge" };
	},
});

function RouteComponent() {
	const { data } = useSuspenseQuery(knowledgeQueries.basesOptions());

	console.log(data, "DATA")
	return (
		<div className="">
			<BrowseKnowledgeBase />
			<KnowledgeBaseListContainer cards={data ?? []} />
		</div>
	);
}