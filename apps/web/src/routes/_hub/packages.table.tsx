import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import { isAuthenticated } from "@/lib/auth-optimized";
import { PackagesTable } from "@/components/features/packages-table/packages-table-advanced";

export const Route = createFileRoute("/_hub/packages/table")({
    component: RouteComponent,
    beforeLoad: () => {
        const authenticated = isAuthenticated();
        return { authenticated };
    },
    loader: async ({ context: { queryClient } }) => {
        const packages = await queryClient.ensureQueryData(
            packageQueries.listOptions({
                page: 1,
                limit: 10,
            })
        );
        return { packages };
    },
});

function RouteComponent() {
    return (
        <div className="w-full p-4 md:p-6 lg:p-8">
            <div className="flex flex-col gap-6 max-w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold text-primary-800">MCP Packages</h1>
                    <p className="text-primary-400">
                        Browse and manage MCP packages with advanced filtering and search capabilities.
                    </p>
                </div>
                <div className="w-full overflow-hidden">
                    <PackagesTable />
                </div>
            </div>
        </div>
    );
}