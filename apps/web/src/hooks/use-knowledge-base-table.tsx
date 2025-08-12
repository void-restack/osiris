
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
    initialPageSize = 10,
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

        return filters;
    }, [search, sortBy, sortOrder, startPrice, endPrice, tags, isPublic, topK]);

    const { data: knowledgeBaseData, isLoading, error, isFetching } = useQuery({
        ...knowledgeQueries.searchOptions(apiFilters),
        placeholderData: keepPreviousData,
    });

    const knowledgeBases: KnowledgeBase[] = knowledgeBaseData?.data?.map((kb: any) => {
            return {
                ...kb.knowledge_bases
            }
    }) || [];

    // Debug logging to track data changes
    React.useEffect(() => {
        console.log('Knowledge base data updated:', {
            sortBy,
            sortOrder,
            dataLength: knowledgeBases.length,
            firstItem: knowledgeBases[0],
            apiFilters
        });
    }, [knowledgeBases, sortBy, sortOrder, apiFilters]);

    const pagination = knowledgeBaseData?.pagination || { totalPages: 1, total: 0, page: 1, limit: 10 };

    // Create a unique key for the table to force re-render when sorting changes
    const tableKey = React.useMemo(() => {
        return `${sortBy || 'no-sort'}-${sortOrder || 'asc'}-${page}-${limit}`;
    }, [sortBy, sortOrder, page, limit]);

    const { table, ...rest } = useDataTable({
        data: knowledgeBases,
        columns,
        pageCount: pagination.totalPages,
        initialState: {
            pagination: { pageIndex: page - 1, pageSize: limit },
        },
        enableAdvancedFilter: false,
        // Force table recreation when key changes
        key: tableKey,
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