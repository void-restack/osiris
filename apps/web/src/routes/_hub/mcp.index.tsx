import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { McpListContainer } from "@/components/features/mcp-list/mcp-list-container";
import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import { packageQueries } from "@/lib/queries";

const packagesSearchSchema = z.object({
	page: z.number().optional().default(1),
	search: z.string().optional(),
	publisherId: z.string().optional(),
});

export const Route = createFileRoute("/_hub/mcp/")({
	validateSearch: packagesSearchSchema,
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context: { queryClient }, deps }) =>
		queryClient.ensureQueryData(
			packageQueries.listOptions({
				page: 0, //deps.search.page,
				name: "", //deps.search.search,
				publisherId: "4beb08f3-a8d7-4610-987b-67763b4b8672", //deps.search.publisherId,
			}),
		),
	component: RouteComponent,
});

function RouteComponent() {
	const publisherId = "4beb08f3-a8d7-4610-987b-67763b4b8672";
	const page = 0;
	const search = "";
	const { data: packages } = useSuspenseQuery(
		packageQueries.listOptions({
			page,
			name: search,
			publisherId,
		}),
	);
	return (
		<main className="flex h-full flex-col">
			<McpSearchBox />
			<McpListContainer />
		</main>
	);
}
