import { createFileRoute } from "@tanstack/react-router";

const getAuthProviderName = async (id: string): Promise<string> => {
	const providers: Record<string, string> = {
		"123": "Google OAuth",
		"456": "GitHub OAuth",
		"789": "Discord OAuth",
	};
	return providers[id] || "Unknown Provider";
};

export const Route = createFileRoute("/_hub/auth/$authId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const providerName = await getAuthProviderName(params.authId);
		return {
			breadcrumb: providerName,
			provider: providerName,
		};
	},
});

function RouteComponent() {
	const { authId } = Route.useParams();

	return <div>Hello {authId}</div>;
}
