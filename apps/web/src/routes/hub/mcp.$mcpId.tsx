import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/mcp/$mcpId")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/hub/mcp/$mcpId"!</div>;
}
