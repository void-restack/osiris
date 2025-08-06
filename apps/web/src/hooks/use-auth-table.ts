"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDataTable } from "@/hooks/use-data-table";
import { hubQueries } from "@/lib/queries";
import { type ColumnDef } from "@tanstack/react-table";
import type { ServiceClient } from "@/types/auth";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    useQueryState,
} from "nuqs";
import { useMemo } from "react";

interface UseAuthTableProps {
    columns: ColumnDef<ServiceClient>[];
    initialPageSize?: number;
}

export function useAuthTable({
    columns,
    initialPageSize = 10,
}: UseAuthTableProps) {
    // URL state management for server-side filtering
    const [search] = useQueryState("search", parseAsString.withDefault(""));
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(initialPageSize));
    const [typeFilter] = useQueryState(
        "type",
        parseAsArrayOf(parseAsString).withDefault([])
    );

    // Build API filters from URL state
    const apiFilters = useMemo(() => {
        const filters: {
            search?: string;
            type?: string;
            page: number;
            limit: number;
        } = {
            page,
            limit,
        };

        // Use search filter for name search
        if (search) {
            filters.search = search;
        }

        // Type filter
        if (typeFilter.length > 0) {
            filters.type = typeFilter[0]; // API expects single type, UI is multi-select
        }

        return filters;
    }, [search, typeFilter, page, limit]);

    // Fetch auth methods with server-side filtering
    const { data: authResponse, isLoading, error, isFetching } = useQuery({
        ...hubQueries.authMethodsOptions(),
        placeholderData: keepPreviousData, // Keep previous data while loading new data
    });

    // Handle response structure - the API returns { status: "SUCCESS", data: [...], pagination: {...} }
    const authMethods = authResponse || [];
    const pagination = { totalPages: 1, total: authMethods.length, page: 1, limit: 10 };

    // Initialize table with server data
    const { table, ...rest } = useDataTable({
        data: authMethods,
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
            data: authMethods,
            pagination: pagination,
        },
        isLoading,
        isFetching, // Indicates background refetching while showing previous data
        error,
        filters: {
            search,
            typeFilter,
            page,
            limit,
        },
        ...rest,
    };
} 