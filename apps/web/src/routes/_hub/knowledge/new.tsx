import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreateNewKnowledgeBase } from "@/components/features/knowledge-base/create-new-knowledge-base";
import { getAuthState } from "@/lib/auth-utils";

export const Route = createFileRoute("/_hub/knowledge/new")({
	component: RouteComponent,
	beforeLoad: async ({ context: { queryClient } }) => {
		const auth = await getAuthState(queryClient);
		if (!auth.isAuthenticated) {
			throw redirect({
				to: '/login',
				search: {
					redirect: '/knowledge/new',
				},
			});
		}

		return { auth };
	},
});

function RouteComponent() {
	return <CreateNewKnowledgeBase />;
}
