import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { packageQueries } from "@/lib/queries";

const packagesSearchSchema = z.object({
	page: z.number().optional().default(1),
	search: z.string().optional(),
	publisherId: z.string().optional(),
});

export const Route = createFileRoute("/hub/mcp")({
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
		<div>
			<h1>Packages</h1>
			<div className="grid gap-4">
				{packages.data.map((pkg) => (
					<div key={pkg.packageId} className="rounded border p-4">
						<h3>{pkg.name}</h3>
						<p>{pkg.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}
