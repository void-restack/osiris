import { KnowledgeBaseDetailsHeader } from "@/components/features/knowledge-base/knowledge-base-details-header";
import { KnowledgeHubTabs } from "@/components/features/knowledge-base/knowledge-base-tabs";
import { createFileRoute } from "@tanstack/react-router";
import { knowledgeQueries } from "@/lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

const searchSchema = z.object({
	tab: z.enum(["Units", "Source"]).default("Units"),
  });

export const Route = createFileRoute("/_hub/knowledge/$id")({
	component: RouteComponent,
	loader: async ({ context: { queryClient }, params: { id} }) => {
		const { data: kb} = await queryClient.ensureQueryData(knowledgeQueries.baseOptions(id));
	},
	validateSearch: searchSchema,
});

function RouteComponent() {
	const { id } = Route.useParams();
	const { data: kb } = useSuspenseQuery(knowledgeQueries.baseOptions(id));
	return <div className="w-full flex flex-col gap-y-[56px]">
		<KnowledgeBaseDetailsHeader kb={kb} />
		<KnowledgeHubTabs knowledgeBaseId={id} />
  </div>;
}
