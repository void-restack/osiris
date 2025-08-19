
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { knowledgeQueries } from "@/lib/queries";
import { type ColumnDef } from "@tanstack/react-table";
import type { KnowledgeBase } from "@/types";

import {
    parseAsBoolean,
    parseAsInteger,
    parseAsString,
    useQueryState,
} from "nuqs";

import { useMemo } from "react";
import { useDataTable } from "./use-data-table";
import React from "react";

interface UseKnowledgeBaseTableProps {
    columns: ColumnDef<KnowledgeBase>[];
    initialPageSize?: number;
}


export function useKnowledgeBaseTable({
    columns,
    initialPageSize = 9,
}: UseKnowledgeBaseTableProps) {
    const [publicMetadata] = useQueryState("publicMetadata", parseAsString.withDefault(""));
    const [startPrice, endPrice] = publicMetadata?.split(",") || [0, 0];

    const [search] = useQueryState("search", parseAsString.withDefault(""));
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(initialPageSize));
    const [sortBy] = useQueryState("sortBy", parseAsString);
    const [sortOrder] = useQueryState("sortOrder", parseAsString.withDefault("asc"));
    const [tags] = useQueryState("tags", parseAsString.withDefault(""));
    const [isPublic] = useQueryState("isPublic", parseAsBoolean.withDefault(true));
    const [topK] = useQueryState("topK", parseAsInteger.withDefault(10));

    const apiFilters = useMemo(() => {
        const filters: {
            name?: string;
            query?: string;
            tags?: string;
            isPublic?: boolean;
            startPrice?: number;
            endPrice?: number;
            sortBy?: 'rating' | 'credits' | 'installs' | 'price' | 'recent';
            sortOrder?: 'asc' | 'desc';
            page?: number;
            limit?: number;
        } = {};

        if (search) {
            filters.name = search;
        }

        if (tags) {
            filters.tags = tags;
        }

        if (isPublic) {
            filters.isPublic = isPublic;
        }

        if (startPrice) {
            filters.startPrice = parseInt(startPrice);
        }

        if (endPrice) {
            filters.endPrice = parseInt(endPrice);
        }

        if (sortBy && ['rating', 'credits', 'installs', 'price', 'recent'].includes(sortBy)) {
            filters.sortBy = sortBy as 'rating' | 'credits' | 'installs' | 'price' | 'recent';
        }

        if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
            filters.sortOrder = sortOrder as 'asc' | 'desc';
        }

        // Always include pagination parameters
        filters.page = page;
        filters.limit = limit;

        return filters;
    }, [search, sortBy, sortOrder, startPrice, endPrice, tags, isPublic, topK, page, limit]);

    const { data: knowledgeBaseData, isLoading, error, isFetching } = useQuery({
        ...knowledgeQueries.basesOptions(apiFilters),
        placeholderData: keepPreviousData,
    });

    const knowledgeBases: KnowledgeBase[] = knowledgeBaseData?.data || [];

    // Debug logging to track data changes
    React.useEffect(() => {
        console.log('Knowledge base data updated:', {
            page,
            limit,
            sortBy,
            sortOrder,
            dataLength: knowledgeBases.length,
            firstItem: knowledgeBases[0],
            apiFilters,
            pagination: knowledgeBaseData?.pagination
        });
    }, [knowledgeBases, sortBy, sortOrder, apiFilters, page, limit, knowledgeBaseData?.pagination]);

    const pagination = knowledgeBaseData?.pagination || { totalPages: 1, total: 0, page: 1, limit: limit };

    const { table, ...rest } = useDataTable({
        data: knowledgeBases,
        columns,
        pageCount: pagination.totalPages,
        initialState: {
            pagination: { pageIndex: page - 1, pageSize: limit },
        },
        enableAdvancedFilter: false,
    });
    return {
        data: knowledgeBases,
        pagination: knowledgeBaseData?.pagination,
        isLoading,
        error,
        isFetching,
        table,
        ...rest,
    };
}