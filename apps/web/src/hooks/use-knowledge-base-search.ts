import { useQuery } from "@tanstack/react-query";
import { knowledgeQueries } from "@/lib/queries";

export interface KnowledgeBaseSearchFilters {
  query?: string;
  userId?: string;
  tags?: string;
  sortBy?: 'rating' | 'credits' | 'installs' | 'price' | 'recent';
  sortOrder?: 'asc' | 'desc';
  isPublic?: boolean;
  startPrice?: number;
  endPrice?: number;
  page?: number;
  limit?: number;
  topK?: number;
}

export function useKnowledgeBaseSearch(filters: KnowledgeBaseSearchFilters = {}) {
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isError,
  } = useQuery({
    ...knowledgeQueries.searchOptions(filters),
    enabled: true, 
  });

  // Handle response structure - the API returns { status: "SUCCESS", data: [...], pagination: {...} }
  const knowledgeBases = data?.data || [];
  const pagination = data?.pagination || { totalPages: 0, total: 0, page: 1, limit: 10 };

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('useKnowledgeBaseSearch - Raw data:', data);
    console.log('useKnowledgeBaseSearch - Extracted knowledgeBases:', knowledgeBases);
    console.log('useKnowledgeBaseSearch - Extracted pagination:', pagination);
  }

  return {
    data: knowledgeBases,
    pagination,
    isLoading,
    error,
    refetch,
    isFetching,
    isError,
  };
}
