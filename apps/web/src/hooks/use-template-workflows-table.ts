import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDataTable } from "@/hooks/use-data-table";
import { chatQueries } from "@/lib/queries";
import { type ColumnDef } from "@tanstack/react-table";
import type { TemplateWorkflowData } from "@/lib/store";
import {
    parseAsInteger,
    parseAsString,
    parseAsArrayOf,
    useQueryState,
} from "nuqs";
import { useMemo } from "react";

interface UseTemplateWorkflowsTableProps {
    columns: ColumnDef<TemplateWorkflowData>[];
    initialPageSize?: number;
    customFilters?: Record<string, any>;
}

export function useTemplateWorkflowsTable({
    columns,
    initialPageSize = 12,
    customFilters = {},
}: UseTemplateWorkflowsTableProps) {
    const [search] = useQueryState("search", parseAsString.withDefault(""));
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(initialPageSize));
    const [nameFilter] = useQueryState(
        "name",
        parseAsString.withDefault("")
    );
    const [visibilityFilter] = useQueryState(
        "visibility",
        parseAsArrayOf(parseAsString).withDefault([])
    );

    const apiFilters = useMemo(() => {
        const filters: {
            name?: string;
            page?: number;
            limit?: number;
            isPublic?: boolean;
        } = {
            page,
            limit,
        };

        if (search) {
            filters.name = search;
        } else if (nameFilter) {
            filters.name = nameFilter;
        }

        // Handle visibility filter
        if (visibilityFilter.length > 0) {
            if (visibilityFilter.includes("Public")) {
                filters.isPublic = true;
            } else if (visibilityFilter.includes("Private")) {
                filters.isPublic = false;
            }
        }

        return { ...filters, ...customFilters };
    }, [search, nameFilter, page, limit, visibilityFilter, customFilters]);

    const { data: templatesResponse, isLoading, error, isFetching } = useQuery({
        ...chatQueries.templateWorkflowsOptions(apiFilters),
        placeholderData: keepPreviousData,
    });

    const templates = templatesResponse?.data || [];
    const pagination = templatesResponse?.pagination || { totalPages: 0, total: 0, page: 1, limit: 10 };

    const { table, ...rest } = useDataTable({
        data: templates,
        columns,
        pageCount: pagination.totalPages,
        initialState: {
            pagination: { pageIndex: page - 1, pageSize: limit },
        },
        enableAdvancedFilter: false,
    });

    return {
        table,
        data: {
            data: templates,
            pagination: pagination,
        },
        isLoading,
        isFetching,
        error,
        filters: {
            search,
            nameFilter,
            visibilityFilter,
            page,
            limit,
        },
        ...rest,
    };
}
