import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/auth/$authId")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/hub/auth/$authId"!</div>;
}
