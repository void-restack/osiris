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
import { MoveUpRight, Eye } from "lucide-react";
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

type ServerStatus = "active" | "inactive" | "pending";

type McpServerData = {
    deploymentId: string;
    userMcpId: string;
    url: string;
    scopes: string[];
    status: ServerStatus;
    createdAt: string;
    updatedAt: string;
};

interface DeploymentDetailsModalProps {
    deployment: McpServerData;
    children: React.ReactNode;
}

function DeploymentDetailsModal({ deployment, children }: DeploymentDetailsModalProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Deployment Details</DialogTitle>
                    <DialogDescription>
                        Deployment ID: {deployment.deploymentId}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Deployment Information</h3>
                            <ScrollArea className="h-64 overflow-hidden max-w-md">
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(deployment, null, 2)}
                                </pre>
                            </ScrollArea>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<McpServerData>[] = [
    {
        accessorKey: "deploymentId",
        header: () => {
            return (
                <h1 className="w-[42px] pr-3 text-right font-medium text-sm">#</h1>
            );
        },
        cell: ({ row }) => (
            <div className="text-right font-medium text-[#737373] text-sm">
                {row.index + 1}
            </div>
        ),
    },
    {
        accessorKey: "deploymentId",
        header: "Deployment ID",
        cell: ({ row }) => (
            <div className="text-[#171717] text-sm">
                {(row.getValue("deploymentId") as string).slice(0, 8)}...
            </div>
        ),
    },
    {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
            <div className="text-[#171717] text-sm">
                {row.getValue("url")}
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
                    variant={row.getValue("status") === 'active' ? 'default' : 'secondary'}
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
                <div className="flex w-[56px] justify-end">
                    <DeploymentDetailsModal deployment={row.original}>
                        <Button
                            className="h-6 w-5 rounded-none bg-[#F5F5F5] hover:bg-[#F5F5F5]"
                            variant={"ghost"}
                        >
                            <Eye width={14} height={14} />
                        </Button>
                    </DeploymentDetailsModal>
                </div>
            );
        },
    },
];

interface McpServersTableProps {
    data: McpServerData[];
    pagination?: {
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    };
    onPageChange?: (page: number) => void;
}

export function McpServersTable({ data, pagination, onPageChange }: McpServersTableProps) {
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
                                        key={header.id + index}
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
                                        className={`h-14 ${index === 0 || index === 5 ? "w-[42px] pr-3" : index === 1 ? "pl-0" : ""}`}
                                        key={cell.id + index}
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
                    <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange?.(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                            >
                                Previous
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
                                Next
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
