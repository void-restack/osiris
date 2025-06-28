import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/auth")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Auth Hub </div>;
}
