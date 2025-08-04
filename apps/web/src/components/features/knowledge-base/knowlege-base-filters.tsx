"use client";

import { useState } from "react";
import { ChevronDown, SortAsc, Clock, Star, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

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
}: KnowledgeBaseFiltersProps) {
	const isMobile = useIsMobile()
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2 w-max shrink-0">
        <Switch
          id="my-kbs-toggle"
          checked={showOnlyMyKBs}
          onCheckedChange={onShowOnlyMyKBsChange}
        />
        <Label
          htmlFor="my-kbs-toggle"
          className="text-sm font-medium text-primary-400"
        >
          My Knowledge Bases
        </Label>
      </div>
      <SortByMenu sortBy={sortBy} onSortByChange={onSortByChange} />
    </div>
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
