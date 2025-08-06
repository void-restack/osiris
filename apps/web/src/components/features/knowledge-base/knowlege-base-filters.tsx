"use client";

import { useState } from "react";
import { ChevronDown, SortAsc, Clock, Star, CreditCard, Shield, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  searchQuery?: string;
  onSearchChange?: (search: string) => void;
};

const sortOptions = [
  { label: "Latest", value: "latest", icon: Clock },
  { label: "Stars", value: "stars", icon: Star },
  { label: "Credits", value: "credits", icon: CreditCard },
];

export function KnowledgeBaseFilters({
  sortBy,
  onSortByChange,
  showOnlyMyKBs,
  onShowOnlyMyKBsChange,
  searchQuery = "",
  onSearchChange,
}: KnowledgeBaseFiltersProps) {
	const isMobile = useIsMobile()
  
  const handleKbTypeChange = (value: "private" | "community") => {
    onShowOnlyMyKBsChange(value === "private");
  };

  return (
    <TooltipProvider>
      <div className="flex w-full items-center justify-between gap-2">
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
                "hover:!bg-white/90",
                !showOnlyMyKBs ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
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
                "hover:!bg-white/90",
                showOnlyMyKBs ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
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
        <SortByMenu sortBy={sortBy} onSortByChange={onSortByChange} />
      </div>
    </TooltipProvider>
  );
}

function SortByMenu({
  sortBy,
  onSortByChange,
}: {
  sortBy: string;
  onSortByChange: (sort: string) => void;
}) {
	const isMobile = useIsMobile()
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sortOptions.find((opt) => opt.value === sortBy);

  return (
    <Popover open={sortOpen} onOpenChange={setSortOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 bg-primary-50 text-primary-400 font-medium text-[13px] rounded-[6px]"
        >
          <SortAsc className="size-3" />
          {isMobile ? (
            <></>
          ) : (
            <>
              {currentSort?.label}
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
              variant={sortBy === option.value ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => {
                onSortByChange(option.value);
                setSortOpen(false);
              }}
            >
              <option.icon className="size-4" />
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
