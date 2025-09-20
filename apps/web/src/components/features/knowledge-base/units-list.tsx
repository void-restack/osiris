import { useState, useMemo } from "react";
import { UnitsCard } from "./units-card";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";
import { UnitDetailModal } from "./unit-detail-modal";
import { useUnitsFilters, type Unit, type Source } from "./use-units-filters";
import { UnitsGridSkeleton } from "./units-card-skeleton";

interface UnitsCardsListProps {
  knowledgeBaseId: string;
  filters: {
    searchQuery: string;
    sourceIds: string[];
    tags: string[];
    dateRange: [Date, Date] | null;
  };
  sortConfig: {
    field: 'latest' | 'name' | 'source' | 'relevant';
    direction: 'asc' | 'desc';
  };
}

export function UnitsCardsList({ knowledgeBaseId, filters, sortConfig }: UnitsCardsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const pageSize = 6;
  
  const { units, sourcesMap, isLoading } = useUnitsFilters({ knowledgeBaseId });
  
  // Apply external filters and sorting
  const filteredAndSortedUnits = useMemo(() => {
    let filtered = units.filter((unit) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          unit.name.toLowerCase().includes(query) ||
          unit.content.toLowerCase().includes(query) ||
          unit.tags.some((tag: string) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      if (filters.sourceIds.length > 0) {
        if (!filters.sourceIds.includes(unit.sourceId)) return false;
      }


      if (filters.dateRange) {
        const createdDate = new Date(unit.createdAt);
        if (createdDate < filters.dateRange[0] || createdDate > filters.dateRange[1]) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
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
            score += unit.content.length > 500 ? 20 : 10;
            score += unit.tags.length * 5;
            score += unit.name.length > 30 ? 10 : 5;
            return score;
          };
          comparison = getRelevanceScore(b) - getRelevanceScore(a);
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [units, filters, sortConfig, sourcesMap]);

  const totalResults = filteredAndSortedUnits.length;
  const totalPages = Math.ceil(totalResults / pageSize);

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedUnits.slice(start, start + pageSize);
  }, [filteredAndSortedUnits, currentPage, pageSize]);

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setModalOpen(true);
  };

  const selectedUnitSource = selectedUnit ? sourcesMap[selectedUnit.sourceId] || null : null;

  return (
    <div className="flex flex-col gap-4">
      {paginatedUnits.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          {paginatedUnits.map((unit) => (
            <UnitsCard 
              key={unit.unitId} 
              unit={unit}
              source={unit.source || null}
              onClick={() => handleUnitClick(unit)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {Object.values(filters).some(value => 
              Array.isArray(value) ? value.length > 0 : value !== null && value !== ''
            ) 
              ? "No units match your current filters. Try adjusting your search criteria."
              : "This knowledge base doesn't have any units yet. Upload some content to get started."
            }
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 py-6 z-50">
          <McpListPagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalResults={totalResults}
          />
        </div>
      )}

      <UnitDetailModal
        unit={selectedUnit}
        source={selectedUnitSource}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
