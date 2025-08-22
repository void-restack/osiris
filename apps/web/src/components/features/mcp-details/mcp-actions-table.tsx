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
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type ActionStatus = "success" | "failed" | "pending";

type McpActionData = {
  actionId: string;
  deploymentId: string;
  userId: string;
  connectionId: string;
  actionType: string;
  request: any;
  response: any;
  status: ActionStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

interface ActionDetailsModalProps {
  action: McpActionData;
  children: React.ReactNode;
}

function ActionDetailsModal({ action, children }: ActionDetailsModalProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Action Details</DialogTitle>
          <DialogDescription>
            Action ID: {action.actionId}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Action Type</h3>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {action.actionType || "Unknown Action"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <Badge
                variant={action.status === 'success' ? 'default' : action.status === 'failed' ? 'destructive' : 'secondary'}
              >
                {action.status}
              </Badge>
            </div>

            {action.status === 'failed' && action.errorMessage && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Error Message</h3>
                <ScrollArea className="max-h-32 h-fit overflow-hidden max-w-md bg-red-50">
                  <div className="text-xs bg-red-50 h-full p-2 text-red-600 rounded max-w-md overflow-auto hidebar text-wrap">
                    {action.errorMessage}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Request</h3>
              <ScrollArea className="h-32 overflow-hidden max-w-md">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto text-wrap">
                  {JSON.stringify(action.request, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            {action.status === 'success' && action.response && (
              <div className="overflow-hidden">
                <h3 className="font-semibold mb-2">Response</h3>
                <ScrollArea className="h-32 overflow-hidden max-w-md">
                  <pre className="text-xs bg-green-50 p-2 rounded overflow-auto text-wrap">
                    {JSON.stringify(action.response, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span> {new Date(action.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {new Date(action.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog >
  );
}

export const columns: ColumnDef<McpActionData>[] = [
  // {
  // 	accessorKey: "actionId",
  // 	header: () => {
  // 		return (
  // 			<h1 className="w-[42px] pr-3 text-right font-medium text-sm">#</h1>
  // 		);
  // 	},
  // 	cell: ({ row }) => (
  // 		<div className="text-right font-medium text-[#737373] text-sm">
  // 			{row.index + 1}
  // 		</div>
  // 	),
  // },
  {
    accessorKey: "actionType",
    header: "Action Type",
    cell: ({ row }) => (
      <div className="text-[#171717] text-sm font-mono max-w-xs truncate">
        {row.getValue("actionType") || "Unknown Action"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => {
      return <p className="text-right">Status</p>;
    },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Badge
          variant={row.getValue("status") === 'success' ? 'default' : row.getValue("status") === 'failed' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {row.getValue("status")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => {
      return <p className="text-right">Created</p>;
    },
    cell: ({ row }) => (
      <div className="text-right text-sm text-primary-300">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "#",
    header: () => {
      <p className="" />;
    },
    cell: ({ row }) => {
      return (
        <div className="flex pr-2 w-full justify-end">
          <ActionDetailsModal action={row.original}>
            <Button
              className="h-6 w-5 rounded-none bg-[#F5F5F5] hover:bg-[#F5F5F5]"
              variant={"ghost"}
            >
              <Eye width={14} height={14} />
            </Button>
          </ActionDetailsModal>
        </div>
      );
    },
  },
];

interface McpActionsTableProps {
  data: McpActionData[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
}

export function McpActionsTable({ data, pagination, onPageChange }: McpActionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="rounded-md border border-[#F5F5F5]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow className="" key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead
                    className={`font-medium text-[#737373] text-sm ${index === 0 ? "pr-0" : index === 1 ? "pl-0" : ""}`}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    className={`h-14 ${index === 0 || index === 4 ? "w-[42px] pr-3" : index === 1 ? "pl-0" : ""}`}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-end px-2 py-4">
            {/* <div className="text-sm text-muted-foreground">
							Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
						</div> */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft />
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
}
