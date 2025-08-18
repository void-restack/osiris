import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDataTable } from "@/hooks/use-data-table";
import { packageQueries } from "@/lib/queries";
import { type ColumnDef } from "@tanstack/react-table";
import type { PackageList } from "@/types";
import {
    parseAsInteger,
    parseAsString,
    parseAsArrayOf,
    useQueryState,
} from "nuqs";
import { useMemo } from "react";

interface UsePackagesTableProps {
    columns: ColumnDef<PackageList>[];
    initialPageSize?: number;
    customFilters?: Record<string, any>;
}

export function usePackagesTable({
    columns,
    initialPageSize = 20,
    customFilters = {},
}: UsePackagesTableProps) {
    const [search] = useQueryState("search", parseAsString.withDefault(""));
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(initialPageSize));
    const [nameFilter] = useQueryState(
        "name",
        parseAsString.withDefault("")
    );
    const [typeFilter] = useQueryState(
        "type",
        parseAsArrayOf(parseAsString).withDefault([])
    );
    const [pricingFilter] = useQueryState(
        "pricing",
        parseAsArrayOf(parseAsString).withDefault([])
    );

    const apiFilters = useMemo(() => {
        const filters: {
            search?: string;
            name?: string;
            type?: string;
            isFree?: boolean;
            minPrice?: number;
            maxPrice?: number;
            createdAfter?: string;
            createdBefore?: string;
            sortBy?: string;
            sortOrder?: string;
            page: number;
            limit: number;
        } = {
            page,
            limit,
        };

        // Use name filter for search box (simple text search, not similarity search)
        if (search) {
            filters.name = search;
        } else if (nameFilter) {
            filters.name = nameFilter;
        }

        if (typeFilter.length > 0) {
            filters.type = typeFilter[0];
        }

        if (pricingFilter.length > 0) {
            const pricing = pricingFilter[0];
            if (pricing === "Free") {
                filters.isFree = true;
            } else if (pricing === "Paid") {
                filters.isFree = false;
            }
        }

        // Merge custom filters
        return { ...filters, ...customFilters };
    }, [search, nameFilter, typeFilter, pricingFilter, page, limit, customFilters]);

    const { data: packagesResponse, isLoading, error, isFetching } = useQuery({
        ...packageQueries.listOptions(apiFilters),
        placeholderData: keepPreviousData,
    });

    const packages = packagesResponse?.data || [];
    const pagination = (packagesResponse as any)?.pagination || { totalPages: 0, total: 0, page: 1, limit: 10 };

    const { table, ...rest } = useDataTable({
        data: packages,
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
            data: packages,
            pagination: pagination,
        },
        isLoading,
        isFetching,
        error,
        filters: {
            search,
            nameFilter,
            typeFilter,
            pricingFilter,
            page,
            limit,
        },
        ...rest,
    };
}