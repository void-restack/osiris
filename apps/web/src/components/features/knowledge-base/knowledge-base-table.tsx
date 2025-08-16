import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKnowledgeBaseTable } from "@/hooks/use-knowledge-base-table";
import type { KnowledgeBase } from "@/types";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Clock, Eye, MoreHorizontal, Plus, Share2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { BuyKnowledgeBaseButton } from "./buy-knowledge-base-button";
import {
  BrowseKnowledgeBaseList,
  KnowledgeBaseGridViewColumns,
} from "./browse-knowledge-base-list";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ICONS } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function KnowledgeBaseTable({
  onTableReady,
  showPagination = false,
}: {
  onTableReady?: (table: any) => void;
  showPagination?: boolean;
}) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const { isAuthenticated } = useAuth();

  const handleShare = (kb: KnowledgeBase) => {
    const url = `${window.location.origin}/knowledge/${kb.knowledgeBaseId}`;
    navigator.clipboard.writeText(url);
  };

  const columns = useMemo<ColumnDef<KnowledgeBase>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Knowledge Base" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          return (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-8 rounded-md shrink-0">
                <AvatarImage src={kb.iconUrl || undefined} alt={kb.name} />
                <AvatarFallback className="rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                  {kb.name?.charAt(0).toUpperCase() || "K"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-[300px]">
                <span className="font-medium text-sm text-primary-800 truncate">
                  {kb.name}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          variant: "text",
          label: "Knowledge Base name",
          placeholder: "search knowledge base",
        },
      },
      {
        id: "description",
        accessorKey: "description",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          return (
            <p className="text-xs text-primary-400 max-w-[200px] w-full truncate">
              {kb.description}
            </p>
          );
        },
      },
      {
        id: "price",
        accessorFn: (row) => row.publicMetadata?.price || 0,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Price" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          const price = kb?.publicMetadata?.price;

          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-xs">
                {price === 0 ? "Free" : `${price} credits`}
              </Badge>
            </div>
          );
        },
        enableSorting: true, // Enable sorting for this column
        meta: {
          label: "Price", // Label for the sorting dropdown
        },
      },
      {
        id: "updatedAt",
        accessorFn: (row) => new Date(row.updatedAt),
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        enableSorting: true, // Enable sorting for this column
        meta: {
          label: "Last Updated", // Label for the sorting dropdown
        },
        cell: ({ row }) => {
          const updatedAt = row.getValue("updatedAt") as string;
          const date = new Date(updatedAt);
          const now = new Date();
          const diffInDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary-400" />
              <span className="text-sm text-primary-600">
                {diffInDays === 0
                  ? "Today"
                  : diffInDays === 1
                    ? "Yesterday"
                    : `${diffInDays}d ago`}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2 md:pr-6">Actions</div>,
        cell: ({ row }) => {
          const kb = row.original;
          return (
            <div className="w-full flex items-end justify-end pr-2 md:pr-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/knowledge/${kb.knowledgeBaseId}`}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BuyKnowledgeBaseButton kb={kb} />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(kb)}>
                    <Share2 className="h-3 w-3 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleShare]
  );

  const activeColumns = useMemo(() => {
    const selectedColumns =
      viewMode === "grid" ? KnowledgeBaseGridViewColumns : columns;
    const searchColumn = selectedColumns.find((col) => col.id === "search");
    return selectedColumns;
  }, [viewMode, columns]);

  const { table, data, pagination, isLoading, error, isFetching } =
    useKnowledgeBaseTable({
      columns: activeColumns,
      initialPageSize: 10,
    });

  React.useEffect(() => {
    if (onTableReady && table) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="space-y-4">
        <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
              All Knowledge Bases
            </span>
            {isFetching && !isLoading && (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex w-full items-center justify-end gap-2">
            <DataTableToolbar className="w-full" table={table} />
            <ToggleGroup
              className="rounded-[6px] bg-[#F5F5F5] p-[2px] h-8"
              type="single"
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "table" | "grid")}
            >
              <ToggleGroupItem
                value="table"
                className={cn(
                  "hover:!bg-white/90 h-full",
                  viewMode === "table"
                    ? "!bg-white data-[state=on]:!bg-white"
                    : "!bg-transparent"
                )}
              >
                <ICONS.list
                  stroke={viewMode === "table" ? "#000000" : "#A3A3A3"}
                />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="grid"
                className={cn(
                  "hover:!bg-white/90 h-full",
                  viewMode === "grid"
                    ? "!bg-white data-[state=on]:!bg-white"
                    : "!bg-transparent"
                )}
              >
                <ICONS.directory
                  stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"}
                />
              </ToggleGroupItem>
            </ToggleGroup>
            {isAuthenticated && (
              <Link to="/knowledge/new">
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-2" />
                  Create Knowledge Base 
                </Button>
              </Link>
            )}
          </div>
        </div>

        {viewMode === "table" ? (
          <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto hidebar px-4">
            <div className="w-full hidebar  pb-8">
              <DataTable table={table} />
            </div>
          </ScrollArea>
        ) : (
          <BrowseKnowledgeBaseList rows={table.getPaginationRowModel().rows} />
        )}
        {showPagination && <DataTablePagination table={table} />}
      </div>
    </div>
  );
}
