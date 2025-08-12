"use client";

import { useState, useMemo } from "react";
import { ChevronDown, SortAsc, Clock, Star, CreditCard, Shield, Users, Filter, DollarSign, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type KnowledgeBaseFiltersProps = {
  tags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  permission: string;
  onPermissionChange: (permission: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  showOnlyMyKBs: boolean;
  onShowOnlyMyKBsChange: (showOnly: boolean) => void;
  // Filter props
  isPublic?: boolean;
  onIsPublicChange?: (isPublic: boolean) => void;
  startPrice?: number;
  onStartPriceChange?: (price: number) => void;
  endPrice?: number;
  onEndPriceChange?: (price: number) => void;
  topK?: number;
  onTopKChange?: (price: number) => void;
  // New installed filter
  showInstalled?: boolean;
  onShowInstalledChange?: (showInstalled: boolean) => void;
  // Reset function
  onReset?: () => void;
};

const sortOptions = [
  { label: "Latest", value: "recent", icon: Clock },
  { label: "Rating", value: "rating", icon: Star },
  { label: "Credits", value: "credits", icon: CreditCard },
  { label: "Installs", value: "installs", icon: Users },
  { label: "Price", value: "price", icon: DollarSign },
];

export function KnowledgeBaseFilters({
  tags,
  selectedTag,
  onTagChange,
  sortBy,
  onSortByChange,
  showOnlyMyKBs,
  onShowOnlyMyKBsChange,
  isPublic = true,
  onIsPublicChange,
  startPrice,
  onStartPriceChange,
  endPrice,
  onEndPriceChange,
  topK,
  onTopKChange,
  showInstalled = false,
  onShowInstalledChange,
  onReset,
}: KnowledgeBaseFiltersProps) {
	const isMobile = useIsMobile();
  
  const handleKbTypeChange = (value: "private" | "community") => {
    onShowOnlyMyKBsChange(value === "private");
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTag !== "all") count++;
    if (showOnlyMyKBs) count++;
    if (showInstalled) count++;
    if (isPublic !== true) count++;
    if (startPrice !== undefined) count++;
    if (endPrice !== undefined) count++;
    if (topK !== 10) count++;
    return count;
  }, [selectedTag, showOnlyMyKBs, showInstalled, isPublic, startPrice, endPrice, topK]);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <TooltipProvider>
      <div className="flex w-max items-center justify-between gap-3">
        {/* Advanced Filters */}
        <AdvancedFilters
          tags={tags}
          selectedTag={selectedTag}
          onTagChange={onTagChange}
          isPublic={isPublic}
          onIsPublicChange={onIsPublicChange}
          startPrice={startPrice}
          onStartPriceChange={onStartPriceChange}
          endPrice={endPrice}
          onEndPriceChange={onEndPriceChange}
          topK={topK}
          onTopKChange={onTopKChange}
          showInstalled={showInstalled}
          onShowInstalledChange={onShowInstalledChange}
          hasActiveFilters={hasActiveFilters}
          onReset={onReset}
        />

        {/* KB Type Toggle */}
        <div className="flex items-center gap-2 w-max shrink-0">
          <ToggleGroup
            className="rounded-[6px] bg-[#F5F5F5] p-[2px]"
            type="single"
            value={showOnlyMyKBs ? "private" : "community"}
            onValueChange={handleKbTypeChange}
          >
            <ToggleGroupItem
              value="community"
              className={cn(
                "hover:!bg-white/90 transition-colors",
                !showOnlyMyKBs ? "!bg-white data-[state=on]:!bg-white shadow-sm" : "!bg-transparent",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Users 
                    className="h-4 w-4" 
                    stroke={!showOnlyMyKBs ? "#000000" : "#A3A3A3"}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show all community knowledge bases</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="private"
              className={cn(
                "hover:!bg-white/90 transition-colors",
                showOnlyMyKBs ? "!bg-white data-[state=on]:!bg-white shadow-sm" : "!bg-transparent",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Shield 
                    className="h-4 w-4" 
                    stroke={showOnlyMyKBs ? "#000000" : "#A3A3A3"}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show only your private knowledge bases</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Sort Menu */}
        <SortByMenu sortBy={sortBy} onSortByChange={onSortByChange} />

        {/* Reset Filters Button */}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground px-2 h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

function AdvancedFilters({
  tags,
  selectedTag,
  onTagChange,
  isPublic,
  onIsPublicChange,
  startPrice,
  onStartPriceChange,
  endPrice,
  onEndPriceChange,
  topK,
  onTopKChange,
  showInstalled,
  onShowInstalledChange,
  hasActiveFilters,
  onReset,
}: {
  tags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  isPublic?: boolean;
  onIsPublicChange?: (isPublic: boolean) => void;
  startPrice?: number;
  onStartPriceChange?: (price: number) => void;
  endPrice?: number;
  onEndPriceChange?: (price: number) => void;
  topK?: number;
  onTopKChange?: (price: number) => void;
  showInstalled?: boolean;
  onShowInstalledChange?: (showInstalled: boolean) => void;
  hasActiveFilters: boolean;
  onReset?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 px-3 h-8 transition-all",
            hasActiveFilters 
              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
              : "bg-primary-50 text-primary-400 hover:bg-primary-100"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-4 px-1.5 text-xs bg-green-200 text-green-800">
              {hasActiveFilters}
            </Badge>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-white border border-gray-200 shadow-lg" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900">Advanced Filters</h4>
            {hasActiveFilters && onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="h-auto p-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <Separator />

          {/* Tags Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Tags</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedTag === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onTagChange("all")}
                className={cn(
                  "h-8 text-xs transition-colors",
                  selectedTag === "all" 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "hover:bg-gray-50"
                )}
              >
                All Tags
              </Button>
              {tags.slice(0, 6).map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTagChange(tag)}
                  className={cn(
                    "h-8 text-xs transition-colors truncate",
                    selectedTag === tag 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "hover:bg-gray-50"
                  )}
                >
                  {tag}
                </Button>
              ))}
            </div>
            {tags.length > 6 && (
              <p className="text-xs text-gray-500 mt-1">
                +{tags.length - 6} more tags available
              </p>
            )}
          </div>

          <Separator />
          
          {/* Installed Filter */}
          {onShowInstalledChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Show Installed Only</label>
              <ToggleGroup
                type="single"
                value={showInstalled ? "installed" : "all"}
                onValueChange={(value) => onShowInstalledChange(value === "installed")}
                className="w-full"
              >
                <ToggleGroupItem 
                  value="all" 
                  className={cn(
                    "flex-1 transition-colors",
                    !showInstalled && "bg-green-100 text-green-800 border-green-200"
                  )}
                >
                  All KBs
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="installed" 
                  className={cn(
                    "flex-1 transition-colors",
                    showInstalled && "bg-green-100 text-green-800 border-green-200"
                  )}
                >
                  Installed Only
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Public/Private Filter */}
          {onIsPublicChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Visibility</label>
              <ToggleGroup
                type="single"
                value={isPublic ? "public" : "private"}
                onValueChange={(value) => onIsPublicChange(value === "public")}
                className="w-full"
              >
                <ToggleGroupItem 
                  value="public" 
                  className={cn(
                    "flex-1 transition-colors",
                    isPublic && "bg-green-100 text-green-800 border-green-200"
                  )}
                >
                  Public
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="private" 
                  className={cn(
                    "flex-1 transition-colors",
                    !isPublic && "bg-green-100 text-green-800 border-green-200"
                  )}
                >
                  Private
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Price Range */}
          {(onStartPriceChange || onEndPriceChange) && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Price Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={startPrice || ""}
                  onChange={(e) => onStartPriceChange?.(Number(e.target.value))}
                  className={cn(
                    "h-8 transition-colors",
                    startPrice !== undefined && "border-green-300 bg-green-50"
                  )}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={endPrice || ""}
                  onChange={(e) => onEndPriceChange?.(Number(e.target.value))}
                  className={cn(
                    "h-8 transition-colors",
                    endPrice !== undefined && "border-green-300 bg-green-50"
                  )}
                />
              </div>
            </div>
          )}

          {/* TopK */}
          {onTopKChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Top K</label>
              <Input
                type="number"
                placeholder="10"
                value={topK || ""}
                onChange={(e) => onTopKChange(Number(e.target.value))}
                className={cn(
                  "h-8 transition-colors",
                  topK !== 10 && "border-green-300 bg-green-50"
                )}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortByMenu({
  sortBy,
  onSortByChange,
}: {
  sortBy: string;
  onSortByChange: (sort: string) => void;
}) {
	const isMobile = useIsMobile();
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sortOptions.find((opt) => opt.value === sortBy);

  return (
    <Popover open={sortOpen} onOpenChange={setSortOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 bg-primary-50 text-primary-400 font-medium text-[13px] rounded-[6px] h-8 px-3 hover:bg-primary-100 transition-colors"
        >
          <SortAsc className="size-3" />
          {isMobile ? (
            <></>
          ) : (
            <>
              {currentSort?.label}
              <ChevronDown className={cn("size-3 transition-transform", sortOpen && "rotate-180")} />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 bg-white border border-gray-200 shadow-lg p-1" align="end">
        <div className="space-y-1">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start gap-2 text-sm transition-colors",
                sortBy === option.value && "bg-green-100 text-green-800 hover:bg-green-200"
              )}
              onClick={() => {
                onSortByChange(option.value);
                setSortOpen(false);
              }}
            >
              <option.icon className="size-4" />
              {option.label}
              {sortBy === option.value && (
                <Badge variant="outline" className="ml-auto h-4 px-1 text-xs bg-green-200 text-green-800 border-green-300">
                  Active
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
