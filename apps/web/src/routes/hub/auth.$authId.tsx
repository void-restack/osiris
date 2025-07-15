import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/auth/$authId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { authId } = Route.useParams();
	console.log("AUTHID: ", authId);
	return <div>Hello {authId}</div>;
}
