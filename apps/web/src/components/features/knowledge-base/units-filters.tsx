import { useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Search, FileText, ExternalLink, Eye, Filter, X, SortAsc, Clock, Type, Globe, Target } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
interface UnitsFiltersProps {
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
  onFilterChange: (key: string, value: any) => void;
  onSortChange: (field: 'latest' | 'name' | 'source' | 'relevant', direction?: 'asc' | 'desc') => void;
  onResetFilters: () => void;
  filterOptions: {
    sources: Array<{
      id: string;
      label: string;
      type: string;
      status: string;
    }>;
    tags: Array<{
      label: string;
      value: string;
    }>;
  };
  hasActiveFilters: boolean;
}

const sortOptions = [
  { value: 'latest', label: 'Latest', icon: Clock },
  { value: 'name', label: 'Name A-Z', icon: Type },
  { value: 'source', label: 'Source', icon: Globe },
  { value: 'relevant', label: 'Most Relevant', icon: Target },
];

function SourceIcon({ sourceType }: { sourceType: string }) {
  switch (sourceType) {
    case 'file':
      return <FileText className="size-4 text-gray-500" />;
    case 'url':
      return <ExternalLink className="size-4 text-blue-500" />;
    case 'youtube_url':
      return <div className="size-4 bg-red-500 rounded-sm flex items-center justify-center text-[8px] text-white font-bold">YT</div>;
    case 'image':
      return <Eye className="size-4 text-green-500" />;
    case 'text':
      return <FileText className="size-4 text-gray-500" />;
    default:
      return <FileText className="size-4 text-gray-500" />;
  }
}

export function UnitsFilters({
  filters,
  sortConfig,
  onFilterChange,
  onSortChange,
  onResetFilters,
  filterOptions,
  hasActiveFilters,
}: UnitsFiltersProps) {
  return (
    <div className="flex items-center gap-4 ml-auto">
      <UnitsFilterBySource
        selectedSourceIds={filters.sourceIds}
        onSourcesChange={(sourceIds) => onFilterChange('sourceIds', sourceIds)}
        sources={filterOptions.sources}
      />
      <SortByTypes
        sortConfig={sortConfig}
        onSortChange={onSortChange}
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function UnitsFilterBySource({
  selectedSourceIds,
  onSourcesChange,
  sources,
}: {
  selectedSourceIds: string[];
  onSourcesChange: (sourceIds: string[]) => void;
  sources: Array<{
    id: string;
    label: string;
    type: string;
    status: string;
  }>;
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredSources = useMemo(() => {
    return sources.filter((s) =>
      s.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [sources, search]);

  const handleToggle = (sourceId: string) => {
    const newSelection = selectedSourceIds.includes(sourceId)
      ? selectedSourceIds.filter((id) => id !== sourceId)
      : [...selectedSourceIds, sourceId];
    onSourcesChange(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/20 text-green-700';
      case 'processing':
        return 'bg-yellow-400/20 text-yellow-700';
      case 'pending':
        return 'bg-blue-400/20 text-blue-700';
      case 'failed':
        return 'bg-red-400/20 text-red-700';
      default:
        return 'bg-gray-400/20 text-gray-700';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="justify-between bg-primary-50 relative">
          <Filter className="size-4 mr-2" />
          {isMobile ? (
            <></>
          ) : (
            <>
              Filter
            </>
          )}
          {selectedSourceIds.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {selectedSourceIds.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] bg-[#FAFAFAD9] backdrop-blur-md p-0 border-none"
      >
        <div className="flex flex-col gap-y-4">
          <p className="border-b border-b-primary-100 pb-2 text-sm font-medium text-[#8C8A94] mb-2 p-4">
            Filter by Knowledge Source
          </p>
          <div className="px-4">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground stroke-primary-300" />
              <Input
                placeholder="Search sources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white placeholder:text-primary-300"
                style={{
                  boxShadow: '0px 7px 14px 0px #00000005, 0px 0px 0px 1px #0000000F inset'
                }}
              />
            </div>
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto px-4 pb-4">
          {filteredSources.map((source) => (
            <label
              key={source.id}
              className="flex items-center gap-3 py-2 cursor-pointer text-[14px] text-primary-400 hover:bg-white/50 rounded px-2 -mx-2"
            >
              <SourceIcon sourceType={source.type} />
              <div className="flex-1 min-w-0">
                <p className="truncate">{source.label}</p>
              </div>
              <Checkbox
                checked={selectedSourceIds.includes(source.id)}
                onCheckedChange={() => handleToggle(source.id)}
              />
            </label>
          ))}
          {filteredSources.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No sources found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortByTypes({
  sortConfig,
  onSortChange,
}: {
  sortConfig: {
    field: 'latest' | 'name' | 'source' | 'relevant';
    direction: 'asc' | 'desc';
  };
  onSortChange: (field: 'latest' | 'name' | 'source' | 'relevant', direction?: 'asc' | 'desc') => void;
}) {
  const isMobile = useIsMobile()
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sortOptions.find(opt => opt.value === sortConfig.field);

  return (
    <Popover open={sortOpen} onOpenChange={setSortOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 bg-primary-50 text-primary-400 font-medium text-[13px] rounded-[6px]">
          <SortAsc className="size-3" />
          {isMobile ? (
            <></>
          ) : (
            <>
              {currentSort?.label}
            </>
          )}
          {isMobile ? (
            <></>
          ) : (
            <>
              <Badge variant="secondary" className="h-4 px-1.5 text-xs text-primary-400">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </Badge>
              <ChevronDown className="size-3" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 bg-primary-00 p-1" align="end">
        <div className="space-y-1">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={sortConfig.field === option.value ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => {
                onSortChange(option.value as any);
                setSortOpen(false);
              }}
            >
              <option.icon className="size-4" />
              {option.label}
              {sortConfig.field === option.value && (
                <Badge variant="outline" className="ml-auto h-4 px-1 text-xs">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </Badge>
              )}
            </Button>
          ))}

          <Separator className="my-2" />

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              onSortChange(sortConfig.field, sortConfig.direction === 'asc' ? 'desc' : 'asc');
              setSortOpen(false);
            }}
          >
            <SortAsc className="h-4 w-4" />
            Toggle Direction
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
