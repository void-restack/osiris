import { useState } from 'react';
import { Filter, SortAsc, ChevronDown, X, Search, Hash, Type, Clock, Download, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { McpFilterOptions, McpSortConfig } from './use-mcp-filters';

interface McpControlsProps {
  filters: McpFilterOptions;
  onFilterChange: <K extends keyof McpFilterOptions>(key: K, value: McpFilterOptions[K]) => void;
  onReset: () => void;
  filterOptions: {
    statuses: { label: string; value: string }[];
    installationStatuses: { label: string; value: string }[];
    // tags: { label: string; value: string }[];
    // publishers: { label: string; value: string }[];
    // dateRange: { min: Date; max: Date };
  };
  hasActiveFilters: boolean;
  sortConfig: McpSortConfig;
  onSortChange: (field: McpSortConfig['field'], direction?: 'asc' | 'desc') => void;
}

const sortOptions = [
  { value: 'relevant' as const, label: 'Most Relevant', icon: Filter },
  { value: 'latest' as const, label: 'Latest', icon: Clock },
  { value: 'name' as const, label: 'Name A-Z', icon: Type },
  { value: 'publisher' as const, label: 'Publisher', icon: Hash },
];

export function McpFilterSortControls({
  filters,
  onFilterChange,
  onReset,
  filterOptions,
  hasActiveFilters,
  sortConfig,
  onSortChange
}: McpControlsProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const activeFilterCount = [
    filters.searchQuery && 1,
    filters.status.length > 0 && 1,
    filters.installationStatus.length > 0 && 1,
    filters.tags.length > 0 && 1,
    filters.publisher.length > 0 && 1,
    filters.dateRange && 1,
  ].filter(Boolean).length;

  const currentSort = sortOptions.find(opt => opt.value === sortConfig.field);

  return (
    <div className="flex items-center gap-2 z-10">
      {/* Search */}
      <div className="relative inset-shadow-search rounded-[6px]">
        <Search className="absolute z-0 left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search packages..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          className="pl-9 w-48 h-8 rounded-[6px] border-none"
        />
      </div>

      {/* Filters */}
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 bg-primary-50 text-primary-400 font-medium text-[13px] rounded-[6px]">
            <Filter className="size-3" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2 bg-primary-00" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onReset();
                    setFilterOpen(false);
                  }}
                  className="h-auto p-1 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <Separator />

            {/* Package Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Pause className="size-4" />
                Package Status
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.statuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={filters.status.includes(status.value)}
                      onCheckedChange={(checked) => {
                        const newStatuses = checked
                          ? [...filters.status, status.value]
                          : filters.status.filter(s => s !== status.value);
                        onFilterChange('status', newStatuses);
                      }}
                    />
                    <Label htmlFor={status.value} className="text-sm cursor-pointer">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Installation Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Download className="size-4" />
                Installation Status
              </Label>
              <div className="space-y-2">
                {filterOptions.installationStatuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`install-${status.value}`}
                      checked={filters.installationStatus.includes(status.value)}
                      onCheckedChange={(checked) => {
                        const newStatuses = checked
                          ? [...filters.installationStatus, status.value]
                          : filters.installationStatus.filter(s => s !== status.value);
                        onFilterChange('installationStatus', newStatuses);
                      }}
                    />
                    <Label htmlFor={`install-${status.value}`} className="text-sm cursor-pointer">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* <Separator /> */}

            {/* Tags Filter */}
            {/* <div className="space-y-2"> */}
            {/*   <Label className="text-sm font-medium flex items-center gap-2"> */}
            {/*     <Hash className="size-4" /> */}
            {/*     Tags ({filterOptions.tags.length}) */}
            {/*   </Label> */}
            {/*   <div className="max-h-32 overflow-y-auto space-y-2"> */}
            {/*     {filterOptions.tags.slice(0, 15).map((tag) => ( */}
            {/*       <div key={tag.value} className="flex items-center space-x-2"> */}
            {/*         <Checkbox */}
            {/*           id={`tag-${tag.value}`} */}
            {/*           checked={filters.tags.includes(tag.value)} */}
            {/*           onCheckedChange={(checked) => { */}
            {/*             const newTags = checked */}
            {/*               ? [...filters.tags, tag.value] */}
            {/*               : filters.tags.filter(t => t !== tag.value); */}
            {/*             onFilterChange('tags', newTags); */}
            {/*           }} */}
            {/*         /> */}
            {/*         <Label htmlFor={`tag-${tag.value}`} className="text-sm cursor-pointer"> */}
            {/*           {tag.label} */}
            {/*         </Label> */}
            {/*       </div> */}
            {/*     ))} */}
            {/*     {filterOptions.tags.length > 15 && ( */}
            {/*       <p className="text-xs text-muted-foreground"> */}
            {/*         ... and {filterOptions.tags.length - 15} more */}
            {/*       </p> */}
            {/*     )} */}
            {/*   </div> */}
            {/* </div> */}
            {/**/}
            {/* <Separator /> */}

            {/* Publisher Filter */}
            {/* <div className="space-y-2"> */}
            {/*   <Label className="text-sm font-medium flex items-center gap-2"> */}
            {/*     <Type className="size-4" /> */}
            {/*     Publishers ({filterOptions.publishers.length}) */}
            {/*   </Label> */}
            {/*   <div className="max-h-32 overflow-y-auto space-y-2"> */}
            {/*     {filterOptions.publishers.slice(0, 10).map((publisher) => ( */}
            {/*       <div key={publisher.value} className="flex items-center space-x-2"> */}
            {/*         <Checkbox */}
            {/*           id={`pub-${publisher.value}`} */}
            {/*           checked={filters.publisher.includes(publisher.value)} */}
            {/*           onCheckedChange={(checked) => { */}
            {/*             const newPublishers = checked */}
            {/*               ? [...filters.publisher, publisher.value] */}
            {/*               : filters.publisher.filter(p => p !== publisher.value); */}
            {/*             onFilterChange('publisher', newPublishers); */}
            {/*           }} */}
            {/*         /> */}
            {/*         <Label htmlFor={`pub-${publisher.value}`} className="text-sm cursor-pointer truncate"> */}
            {/*           {publisher.label} */}
            {/*         </Label> */}
            {/*       </div> */}
            {/*     ))} */}
            {/*     {filterOptions.publishers.length > 10 && ( */}
            {/*       <p className="text-xs text-muted-foreground"> */}
            {/*         ... and {filterOptions.publishers.length - 10} more */}
            {/*       </p> */}
            {/*     )} */}
            {/*   </div> */}
            {/* </div> */}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort */}
      <Popover open={sortOpen} onOpenChange={setSortOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 bg-primary-50 text-primary-400 font-medium text-[13px] rounded-[6px]">
            <SortAsc className="size-3" />
            {currentSort?.label}
            <Badge variant="secondary" className="h-4 px-1.5 text-xs text-primary-400">
              {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </Badge>
            <ChevronDown className="size-3" />
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
                  onSortChange(option.value);
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

      {/* Clear All */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
