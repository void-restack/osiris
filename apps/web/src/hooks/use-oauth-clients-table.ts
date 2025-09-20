import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useDataTable } from "@/hooks/use-data-table";
import { hubQueries } from "@/lib/queries";
import type { OAuthClient } from "@/types";

interface UseOAuthClientsTableProps {
    columns: ColumnDef<OAuthClient>[];
    initialPageSize?: number;
}

export function useOAuthClientsTable({
    columns,
    initialPageSize = 20,
}: UseOAuthClientsTableProps) {
    // Fetch OAuth clients
    const { data: oauthClientsResponse, isLoading, error, isFetching } = useQuery({
        ...hubQueries.oauthClientsOptions(),
        placeholderData: keepPreviousData,
    });

    // Handle response structure
    const oauthClients = oauthClientsResponse || [];

    // Initialize table with client data
    const { table, ...rest } = useDataTable({
        data: oauthClients,
        columns,
        pageCount: 1, // For now, we'll implement simple pagination later
        initialState: {
            pagination: { pageIndex: 0, pageSize: initialPageSize },
        },
        enableAdvancedFilter: false,
    });

    return {
        table,
        data: {
            data: oauthClients,
            pagination: { total: oauthClients.length, totalPages: 1, page: 1, limit: initialPageSize },
        },
        isLoading,
        isFetching,
        error,
        ...rest,
    };
}
