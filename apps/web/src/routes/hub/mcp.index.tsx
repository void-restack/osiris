import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/mcp/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<h1>Packages</h1>
			<div className="grid gap-4"></div>
		</div>
	);
}
