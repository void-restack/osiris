import { useMemo, useState } from 'react';
import type { ServiceClient } from '@/types/auth';
import type { FilterOptions, SortConfig, SortOption } from '@/types';

interface UseAuthFiltersProps {
  methods: ServiceClient[];
}

export function useAuthFilters({ methods }: UseAuthFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    type: [],
    scopeRange: null,
    dateRange: null,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'latest',
    direction: 'desc'
  });

  const filteredMethods = useMemo(() => {
    return methods.filter((method) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          method.name.toLowerCase().includes(query) ||
          method.description.toLowerCase().includes(query) ||
          method.supportedServices.some(service =>
            service.toLowerCase().includes(query)
          );
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type.length > 0) {
        if (!filters.type.includes(method.type)) return false;
      }

      // Scope range filter
      if (filters.scopeRange) {
        const scopeCount = Object.keys(method.scopeDefinitions).length;
        if (scopeCount < filters.scopeRange[0] || scopeCount > filters.scopeRange[1]) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const createdDate = new Date(method.createdAt);
        if (createdDate < filters.dateRange[0] || createdDate > filters.dateRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [methods, filters]);

  // Sort filtered methods
  const sortedAndFilteredMethods = useMemo(() => {
    const sorted = [...filteredMethods].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'scopes':
          comparison = Object.keys(b.scopeDefinitions).length - Object.keys(a.scopeDefinitions).length;
          break;
        case 'latest':
        case 'new':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'relevant':
        default:
          const getRelevanceScore = (method: ServiceClient) => {
            let score = 0;
            score += Object.keys(method.scopeDefinitions).length * 2; // More scopes = more relevant
            score += method.supportedServices.length; // More services = more relevant
            score += method.description.length > 50 ? 10 : 0; // Well-described = more relevant
            return score;
          };
          comparison = getRelevanceScore(b) - getRelevanceScore(a);
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredMethods, sortConfig]);

  // Update specific filter
  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Update sort configuration
  const updateSort = (field: SortOption, direction?: 'asc' | 'desc') => {
    setSortConfig(prev => ({
      field,
      direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc')
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      type: [],
      scopeRange: null,
      dateRange: null,
    });
  };

  // Get available filter options
  const filterOptions = useMemo(() => {
    const types = Array.from(new Set(methods.map(m => m.type)));
    const scopeCounts = methods.map(m => Object.keys(m.scopeDefinitions).length);
    const maxScopes = Math.max(...scopeCounts, 0);
    const minScopes = Math.min(...scopeCounts, 0);

    return {
      types: types.map(type => ({
        label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: type
      })),
      scopeRange: [minScopes, maxScopes] as [number, number],
      dateRange: {
        min: new Date(Math.min(...methods.map(m => new Date(m.createdAt).getTime()))),
        max: new Date(Math.max(...methods.map(m => new Date(m.createdAt).getTime())))
      }
    };
  }, [methods]);

  return {
    filters,
    sortConfig,
    filteredMethods: sortedAndFilteredMethods,
    updateFilter,
    updateSort,
    resetFilters,
    filterOptions,
    hasActiveFilters: Object.values(filters).some(value =>
      Array.isArray(value) ? value.length > 0 : value !== null && value !== ''
    )
  };
}
