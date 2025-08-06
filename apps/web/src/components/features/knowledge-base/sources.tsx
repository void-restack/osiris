"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  File,
  FileText,
  Link,
  ExternalLink,
  Eye,
  Image,
  Youtube,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { knowledgeQueries, userQueries } from "@/lib/queries";
import { useRetryKnowledgeSourceMutation } from "@/lib/mutations";
import { Route } from "@/routes/_hub/knowledge/$id";
import { isAuthenticated } from "@/lib/auth-optimized";
import { UploadContentInput } from "./upload-contnet";
import { GetStartedAlerts } from "./get-started-alert";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

type SourceType = "image" | "text" | "youtube_url" | "url" | "file";
type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

type KnowledgeSource = {
  sourceId: string;
  knowledgeBaseId: string;
  sourceType: SourceType;
  source: string;
  processingStatus: ProcessingStatus;
  processingErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

const IconConfig = {
  text: FileText,
  file: File,
  image: Image,
  url: Link,
  youtube_url: Youtube,
} as const;

const StatusConfig = {
  pending: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    label: "Pending",
  },
  processing: {
    icon: AlertCircle,
    color: "bg-blue-100 text-blue-800",
    label: "Processing",
  },
  completed: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    label: "Completed",
  },
  failed: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Failed" },
} as const;

function ClickableSource({ source }: { source: KnowledgeSource }) {
  const getSourceName = (source: KnowledgeSource) => {
    if (source.sourceType === "url" || source.sourceType === "youtube_url") {
      try {
        const url = new URL(source.source);
        return url.hostname + (url.pathname !== "/" ? url.pathname : "");
      } catch {
        return source.source.length > 60
          ? source.source.slice(0, 60) + "..."
          : source.source;
      }
    }
    if (source.sourceType === "file") {
      const fileName = source.source.split("/").pop() || "File";
      return fileName.length > 40 ? fileName.slice(0, 40) + "..." : fileName;
    }
    if (source.sourceType === "text") {
      const cleanText = source.source.replace(/\s+/g, " ").trim();
      return cleanText.length > 60 ? cleanText.slice(0, 60) + "..." : cleanText;
    }
    return source.source.length > 60
      ? source.source.slice(0, 60) + "..."
      : source.source;
  };

  const getIconForType = (sourceType: SourceType) => {
    switch (sourceType) {
      case "url":
      case "youtube_url":
      case "file":
        return <ExternalLink className="h-3 w-3" />;
      case "text":
      case "image":
        return <Eye className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const title = getSourceName(source);
  const icon = getIconForType(source.sourceType);

  const handleClick = () => {
    if (source.sourceType === "url" || source.sourceType === "youtube_url") {
      window.open(source.source, "_blank");
    }
    if (source.sourceType === "file") {
      const fileUrl =
        source.source.startsWith("http://") ||
          source.source.startsWith("https://")
          ? source.source
          : source.source.startsWith("/")
            ? source.source
            : `/${source.source}`;
      window.open(fileUrl, "_blank");
    }
  };

  const renderContent = () => {
    const isTruncated = title.includes("...");
    const fullText =
      source.sourceType === "url" ||
        source.sourceType === "youtube_url" ||
        source.sourceType === "file"
        ? source.source
        : source.sourceType === "text"
          ? source.source.replace(/\s+/g, " ").trim()
          : source.source;

    const content = (
      <div className="flex items-center gap-2 text-[#171717] text-sm cursor-pointer hover:text-gray-600 transition-colors">
        {icon}
        <span className="underline-offset-2 hover:underline truncate max-w-[350px]">
          {title}
        </span>
      </div>
    );

    if (isTruncated) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-words">{fullText}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  switch (source.sourceType) {
    case "url":
    case "youtube_url":
    case "file":
      return <div onClick={handleClick}>{renderContent()}</div>;
    case "text":
      return (
        <Dialog>
          <DialogTrigger asChild>{renderContent()}</DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Text Content</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh] p-4 bg-gray-50 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{source.source}</pre>
            </div>
          </DialogContent>
        </Dialog>
      );
    case "image":
      return (
        <Dialog>
          <DialogTrigger asChild>{renderContent()}</DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh] flex items-center justify-center">
              <img
                src={source.source}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    default:
      const isTruncated = title.includes("...");
      const content = (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Eye className="h-3 w-3" />
          <span className="truncate max-w-[350px]">{title}</span>
        </div>
      );

      if (isTruncated) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs break-words">{source.source}</p>
            </TooltipContent>
          </Tooltip>
        );
      }

      return content;
  }
}

export const createColumns = (currentUser?: any, knowledgeBaseUserId?: string): ColumnDef<KnowledgeSource>[] => [
  {
    accessorKey: "sourceId",
    header: ({ column }) => {
      return (
        <button
          type="button"
          className="w-[42px] pr-3 text-right font-medium text-sm flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          #{column.getIsSorted() === "asc" && <span>▲</span>}
          {column.getIsSorted() === "desc" && <span>▼</span>}
        </button>
      );
    },
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-medium text-[#737373] text-sm">
        {row.index + 1}
      </div>
    ),
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <button
        type="button"
        className="font-normal text-primary-400 text-sm flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Knowledge Source
        {column.getIsSorted() === "asc" && (
          <span>
            <ChevronUp className="text-xs" />
          </span>
        )}
        {column.getIsSorted() === "desc" && (
          <span>
            <ChevronDown className="text-xs" />
          </span>
        )}
      </button>
    ),
    enableSorting: true,
    cell: ({ row }) => {
      const source = row.original;
      return (
        <div className="w-[400px] overflow-hidden">
          <ClickableSource source={source} />
        </div>
      );
    },
  },
  {
    accessorKey: "sourceType",
    header: ({ column }) => (
      <button
        type="button"
        className="font-normal text-primary-400 text-sm flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type
        {column.getIsSorted() === "asc" && <span>▲</span>}
        {column.getIsSorted() === "desc" && <span>▼</span>}
      </button>
    ),
    enableSorting: true,
    cell: ({ row }) => {
      const sourceType = row.getValue("sourceType") as SourceType;
      const IconComponent = IconConfig[sourceType];

      return (
        <div className="flex h-6 w-max items-center gap-1.5 rounded-[6px] bg-[#1717170F] px-2 py-1.5 text-[#171717CC] text-sm">
          {IconComponent && <IconComponent className="w-2.5 h-2.5" />}
          {sourceType.replace("_", " ")}
        </div>
      );
    },
  },
  {
    accessorKey: "processingStatus",
    header: ({ column }) => (
      <button
        type="button"
        className="font-normal text-primary-400 text-sm flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        {column.getIsSorted() === "asc" && <span>▲</span>}
        {column.getIsSorted() === "desc" && <span>▼</span>}
      </button>
    ),
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.getValue("processingStatus") as ProcessingStatus;
      const statusConfig = StatusConfig[status];
      const IconComponent = statusConfig.icon;

      return (
        <Badge
          variant="secondary"
          className={cn("flex items-center gap-1.5", statusConfig.color)}
        >
          <IconComponent className="w-3 h-3" />
          {statusConfig.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <button
        type="button"
        className="font-normal text-primary-400 text-sm flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        {column.getIsSorted() === "asc" && <span>▲</span>}
        {column.getIsSorted() === "desc" && <span>▼</span>}
      </button>
    ),
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-sm text-gray-600">{date.toLocaleDateString()}</div>
      );
    },
  },
  {
    id: "errors",
    header: () => null,
    enableSorting: false,
    cell: ({ row }) => {
      const source = row.original;
      const retryMutation = useRetryKnowledgeSourceMutation();

      const handleRetry = () => {
        retryMutation.mutate(source.sourceId);
      };

      return (
        <div className="flex justify-end gap-1">
          {source.processingErrorMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600"
                >
                  <AlertCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{source.processingErrorMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {source.processingStatus === 'failed' && currentUser?.id === knowledgeBaseUserId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  onClick={handleRetry}
                  disabled={retryMutation.isPending}
                >
                  <RefreshCw className={`h-3 w-3 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retry processing</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
];

export function SourcesTable() {
  const { id: knowledgeBaseId } = Route.useParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const authenticated = isAuthenticated();

  // Fetch current user data if authenticated
  const { data: currentUser } = useQuery({
    ...userQueries.meOptions(authenticated),
    enabled: authenticated,
  });

  // Fetch knowledge base details including user information
  const { data: knowledgeBase } = useQuery(
    knowledgeQueries.baseOptions(knowledgeBaseId)
  );

  const { data: sources = [], isLoading } = useQuery(
    knowledgeQueries.sourcesOptions(knowledgeBaseId)
  );

  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;
  const totalResults = sources.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sources.slice(start, start + pageSize);
  }, [sources, currentPage, pageSize]);

  const columns = React.useMemo(() =>
    createColumns(currentUser, knowledgeBase?.userId),
    [currentUser, knowledgeBase?.userId]
  );

  const table = useReactTable({
    data: paginatedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={5}
        rowCount={10}
        withPagination={true}
        filterCount={0}
        cellWidths={["3rem", "12rem", "8rem", "6rem", "4rem"]}
      />
    );
  }

  if (sources.length === 0) {
    return (
      <div className="w-full flex flex-col gap-4">
        <UploadContentInput
          knowledgeBaseId={knowledgeBaseId}
        />
        <GetStartedAlerts />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border border-[#F5F5F5]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="" key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      className={`bg-primary-25 font-normal text-primary-400 text-sm ${index === 0 ? "pr-0" : index === 1 ? "pl-0" : ""
                        }`}
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="hover:bg-primary-25"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      className={`h-14 ${index === 0 ||
                          index === table.getVisibleFlatColumns().length - 1
                          ? "w-[42px] pr-3"
                          : index === 1
                            ? "pl-0"
                            : ""
                        }`}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <McpListPagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalResults={totalResults}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
