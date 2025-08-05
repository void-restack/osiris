"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTable } from "@/hooks/use-data-table";
import type { PackageWithUserStatus } from "@/types";
import { createMcpColumns } from "./mcp-table-columns";

interface McpTableComponentProps {
    data: PackageWithUserStatus[];
    pageCount: number;
    isLoading?: boolean;
}

export function McpTableComponent({ data, pageCount, isLoading }: McpTableComponentProps) {
    const columns = React.useMemo(() => createMcpColumns(), []);

    const { table } = useDataTable({
        data,
        columns,
        pageCount,
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
        getRowId: (originalRow) => originalRow.packageId,
        shallow: false,
        clearOnDefault: true,
    });

    if (isLoading) {
        return (
            <div className="p-6">
                <DataTableSkeleton columnCount={6} rowCount={10} />
            </div>
        );
    }

    return (
        <>
            {/* Table Header */}
            <div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4">
                <h4 className="font-medium text-xl">
                    MCP Packages ({data.length})
                </h4>
            </div>

            {/* DataTable with toolbar and pagination */}
            <div className="p-6">
                <DataTable table={table}>
                    <DataTableToolbar table={table} />
                </DataTable>
            </div>

            <div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-100 p-6">
                <DataTablePagination table={table} />
            </div>
        </>
    );
} 