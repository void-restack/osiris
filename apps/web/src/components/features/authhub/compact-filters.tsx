import { useState } from 'react';
import { Filter, SortAsc, ChevronDown, X, Search, Hash, Type, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
// import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { FilterOptions, SortConfig, SortOption } from '@/types/index';

interface ControlsProps {
  filters: FilterOptions;
  onFilterChange: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  onReset: () => void;
  filterOptions: {
    types: { label: string; value: string }[];
    scopeRange: [number, number];
    dateRange: { min: Date; max: Date };
  };
  hasActiveFilters: boolean;
  sortConfig: SortConfig;
  onSortChange: (field: SortOption, direction?: 'asc' | 'desc') => void;
}

const sortOptions = [
  { value: 'relevant' as SortOption, label: 'Most Relevant', icon: Filter },
  { value: 'latest' as SortOption, label: 'Latest', icon: Clock },
  { value: 'name' as SortOption, label: 'Name A-Z', icon: Type },
  { value: 'scopes' as SortOption, label: 'Most Scopes', icon: Hash },
];

export function FilterSortControls({
  filters,
  onFilterChange,
  onReset,
  filterOptions,
  hasActiveFilters,
  sortConfig,
  onSortChange
}: ControlsProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const activeFilterCount = [
    filters.searchQuery && 1,
    filters.type.length > 0 && 1,
    filters.scopeRange && 1,
    filters.dateRange && 1,
  ].filter(Boolean).length;

  const currentSort = sortOptions.find(opt => opt.value === sortConfig.field);

  return (
    <div className="flex items-center gap-2 z-10">
      {/* Compact Search */}
      <div className="relative inset-shadow-search rounded-[6px]">
        <Search className="absolute z-0 left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          className="pl-9 w-48 h-8 rounded-[6px] border-none"
        />
      </div>

      {/* Filters Popover */}
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
        <PopoverContent className="w-60 p-2 bg-primary-00" align="start">
          <div className="space-y-2">
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
                  Clear
                </Button>
              )}
            </div>

            <Separator />

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <div className="space-y-2">
                {filterOptions.types.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={filters.type.includes(type.value)}
                      onCheckedChange={(checked) => {
                        const newTypes = checked
                          ? [...filters.type, type.value]
                          : filters.type.filter(t => t !== type.value);
                        onFilterChange('type', newTypes);
                      }}
                    />
                    <Label htmlFor={type.value} className="text-sm cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Scope Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Scope Count</Label>
              <div className="px-2">
                <Slider
                  value={filters.scopeRange || filterOptions.scopeRange}
                  onValueChange={(value) => onFilterChange('scopeRange', value as [number, number])}
                  min={filterOptions.scopeRange[0]}
                  max={filterOptions.scopeRange[1]}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{(filters.scopeRange || filterOptions.scopeRange)[0]}</span>
                  <span>{(filters.scopeRange || filterOptions.scopeRange)[1]}</span>
                </div>
              </div>
            </div>

            {/* <Separator /> */}

            {/* Date Range */}
            {/* <div className="space-y-2"> */}
            {/*   <Label className="text-sm font-medium">Created Date</Label> */}
            {/*   <Popover> */}
            {/*     <PopoverTrigger asChild> */}
            {/*       <Button */}
            {/*         variant="outline" */}
            {/*         className={cn( */}
            {/*           "w-full justify-start text-left font-normal h-8", */}
            {/*           !filters.dateRange && "text-muted-foreground" */}
            {/*         )} */}
            {/*       > */}
            {/*         <Calendar className="mr-2 h-3 w-3" /> */}
            {/*         {filters.dateRange ? ( */}
            {/*           `${filters.dateRange[0].toLocaleDateString()} - ${filters.dateRange[1].toLocaleDateString()}` */}
            {/*         ) : ( */}
            {/*           "Select range" */}
            {/*         )} */}
            {/*       </Button> */}
            {/*     </PopoverTrigger> */}
            {/*     <PopoverContent className="w-auto p-0" align="start"> */}
            {/*       <CalendarComponent */}
            {/*         mode="range" */}
            {/*         selected={{ */}
            {/*           from: filters.dateRange?.[0], */}
            {/*           to: filters.dateRange?.[1] */}
            {/*         }} */}
            {/*         onSelect={(range) => { */}
            {/*           if (range?.from && range?.to) { */}
            {/*             onFilterChange('dateRange', [range.from, range.to]); */}
            {/*           } else { */}
            {/*             onFilterChange('dateRange', null); */}
            {/*           } */}
            {/*         }} */}
            {/*         numberOfMonths={2} */}
            {/*       /> */}
            {/*     </PopoverContent> */}
            {/*   </Popover> */}
            {/* </div> */}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort Popover */}
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

      {/* Active Filters Indicator */}
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
