import { useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fileTypes } from "@/config/sort-option";

const MOCK_SOURCES = [
  { id: 1, label: "OpenSea NFT Trading (NFT)", icon: "spreadsheet" },
  { id: 2, label: "www.globaldata.com", icon: "text" },
  { id: 3, label: "Onboarding Contract.doc", icon: "doc" },
  { id: 4, label: "Sign Message - Basic (Authentication)", icon: "link" },
  { id: 5, label: "Compound V3 Lending (DeFi)", icon: "pdf" },
];

function SourceIcon({ icon }: { icon: string }) {
  if (icon === "spreadsheet") return <span className="mr-2">📊</span>;
  if (icon === "text") return <span className="mr-2">T</span>;
  if (icon === "doc") return <span className="mr-2">📄</span>;
  if (icon === "link") return <span className="mr-2">🔗</span>;
  if (icon === "pdf") return <span className="mr-2">PDF</span>;
  return <span className="mr-2">📁</span>;
}

export function UnitsFilters({
  sortBy,
  onSortByChange,
}: {
  sortBy: string;
  onSortByChange: (sort: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 ml-auto">
      <UnitsFilterBySource />
      <SortByFileTypes sortBy={sortBy} onSortByChange={onSortByChange} />
    </div>
  );
}

export function UnitsFilterBySource() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const filteredSources = useMemo(() => {
    return MOCK_SOURCES.filter((s) =>
      s.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleToggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="justify-between bg-primary-50">
          Filter
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
                placeholder="Search"
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
        <div className="max-h-56 overflow-y-auto px-4">
          {filteredSources.map((source) => (
            <label
              key={source.id}
              className="flex items-center gap-2 py-2 cursor-pointer text-[15px] text-primary-400"
            >
              <SourceIcon icon={source.icon} />
              <span className="flex-1">{source.label}</span>
              <Checkbox
                checked={selected.includes(source.id)}
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

function SortByFileTypes({
  sortBy,
  onSortByChange,
}: {
  sortBy: string;
  onSortByChange: (sort: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2 bg-primary-50">
          Sort by: {fileTypes.find((opt) => opt.value === sortBy)?.label}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {fileTypes.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortByChange(option.value)}
            className="pl-2"
          >
            <span className="flex items-center gap-2">
              <Checkbox
                checked={sortBy === option.value}
                className="pointer-events-none"
              />
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
