import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { knowledgeQueries } from '@/lib/queries';

export interface Unit {
  unitId: string;
  knowledgeBaseId: string;
  sourceId: string;
  name: string;
  content: string;
  tags: string[];
  type: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  sourceId: string;
  knowledgeBaseId: string;
  sourceType: 'image' | 'text' | 'youtube_url' | 'url' | 'file';
  source: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UnitsFilters {
  searchQuery: string;
  sourceIds: string[];
  tags: string[];
  dateRange: [Date, Date] | null;
}

interface SortConfig {
  field: 'latest' | 'name' | 'source' | 'relevant';
  direction: 'asc' | 'desc';
}

interface UseUnitsFiltersProps {
  knowledgeBaseId: string;
}

export function useUnitsFilters({ knowledgeBaseId }: UseUnitsFiltersProps) {
  const [filters, setFilters] = useState<UnitsFilters>({
    searchQuery: '',
    sourceIds: [],
    tags: [],
    dateRange: null,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'latest',
    direction: 'desc'
  });

  // Fetch units and sources data
  const { data: units = [], isLoading: unitsLoading } = useQuery(knowledgeQueries.unitsOptions(knowledgeBaseId));
  const { data: sources = [], isLoading: sourcesLoading } = useQuery(knowledgeQueries.sourcesOptions(knowledgeBaseId));

  // Create a lookup map for sources
  const sourcesMap = useMemo(() => {
    return sources.reduce((acc: Record<string, Source>, source: Source) => {
      acc[source.sourceId] = source;
      return acc;
    }, {} as Record<string, Source>);
  }, [sources]);

  // Filter units based on current filters
  const filteredUnits = useMemo(() => {
    return units.filter((unit: Unit) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          unit.name.toLowerCase().includes(query) ||
          unit.content.toLowerCase().includes(query) ||
          unit.tags.some((tag: string) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Source filter
      if (filters.sourceIds.length > 0) {
        if (!filters.sourceIds.includes(unit.sourceId)) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((filterTag: string) => 
          unit.tags.some((unitTag: string) => unitTag.toLowerCase().includes(filterTag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const createdDate = new Date(unit.createdAt);
        if (createdDate < filters.dateRange[0] || createdDate > filters.dateRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [units, filters]);

  // Sort filtered units
  const sortedAndFilteredUnits = useMemo(() => {
    const sorted = [...filteredUnits].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'source':
          const sourceA = sourcesMap[a.sourceId]?.source || '';
          const sourceB = sourcesMap[b.sourceId]?.source || '';
          comparison = sourceA.localeCompare(sourceB);
          break;
        case 'latest':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'relevant':
        default:
          const getRelevanceScore = (unit: Unit) => {
            let score = 0;
            score += unit.content.length > 500 ? 20 : 10; // Longer content = more relevant
            score += unit.tags.length * 5; // More tags = more relevant
            score += unit.name.length > 30 ? 10 : 5; // Well-named = more relevant
            return score;
          };
          comparison = getRelevanceScore(b) - getRelevanceScore(a);
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredUnits, sortConfig, sourcesMap]);

  // Update specific filter
  const updateFilter = <K extends keyof UnitsFilters>(
    key: K,
    value: UnitsFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Update sort configuration
  const updateSort = (field: SortConfig['field'], direction?: 'asc' | 'desc') => {
    setSortConfig(prev => ({
      field,
      direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc')
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      sourceIds: [],
      tags: [],
      dateRange: null,
    });
  };

  // Get available filter options
  const filterOptions = useMemo(() => {
    const allTags = Array.from(new Set(units.flatMap((u: Unit) => u.tags)));
    const availableSources = sources.map((source: Source) => ({
      id: source.sourceId,
      label: source.source,
      type: source.sourceType,
      status: source.processingStatus
    }));

    return {
      tags: allTags.map((tag) => ({ label: String(tag), value: String(tag) })),
      sources: availableSources,
      dateRange: {
        min: new Date(Math.min(...units.map((u: Unit) => new Date(u.createdAt).getTime()))),
        max: new Date(Math.max(...units.map((u: Unit) => new Date(u.createdAt).getTime())))
      }
    };
  }, [units, sources]);

  return {
    units: sortedAndFilteredUnits,
    sources,
    sourcesMap,
    filters,
    sortConfig,
    updateFilter,
    updateSort,
    resetFilters,
    filterOptions,
    isLoading: unitsLoading || sourcesLoading,
    hasActiveFilters: Object.values(filters).some(value =>
      Array.isArray(value) ? value.length > 0 : value !== null && value !== ''
    )
  };
}