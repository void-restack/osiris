import { knowledgeQueries } from "@/lib/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_hub/knowledge/")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(knowledgeQueries.basesOptions());
		return { breadcrumb: "Authentication" };
	  },
});

function RouteComponent() {
	return <div>Hello "/_hub/knowledge/knowledge/"!</div>;
}
