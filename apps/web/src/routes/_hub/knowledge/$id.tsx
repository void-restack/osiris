import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_hub/knowledge/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_hub/knowledge/knowledge/$id"!</div>;
}
