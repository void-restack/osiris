"use client";

import * as React from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoveUpRight } from "lucide-react";
import type { McpCardProps } from "./mcp-card";
import { McpTag, type McpTagProps } from "@/components/tag";

type actionStatus = "Pending" | "Failed" | "Success";



const data: McpCardProps[] = [
  {
    title: "Analysing and syncing contacts",
    description: "Analysing and syncing contacts",
    tags: [{tag: "Type", }],
    icon: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
    userHandle: "John Doe",
    isVerified: true,
  },
  {
    title: "Send an Email",
    description: "Send an Email",
    tags: [{tag: "Type", }],
    icon: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
    userHandle: "John Doe",
    isVerified: true,
  },
  {
    title: "Draft an Email",
    description: "Draft an Email",
    tags: [{tag: "Type", }],
    icon: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
    userHandle: "John Doe",
    isVerified: true,
  },
];

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<McpCardProps>[] = [
  {
    accessorKey: "id",
    header: () => {
        return <h1 className="font-medium text-sm text-right w-[42px] pr-3">#</h1>
    },
    cell: ({ row }) => <div className="font-medium text-sm text-[#737373] text-right">{row.index + 1}</div>,
  },
  {
    accessorKey: "title",
    header: "Name",
    cell: ({ row }) => (
      <div className="capitalize text-sm text-[#171717]">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Timestamp",
    cell: ({ row }) => <div className="lowercase">{row.getValue("isVerified") ? "Verified" : "Unverified"}</div>,
  },
  {
    accessorKey: "tags",
    header: () => {
        <p>Type</p>
    },
    cell: ({ row }) => {
        return <div className="w-[56px]">
            <McpTag tag={(row.getValue("tags") as McpTagProps[])[0].tag} />
        </div>
    }
  }
];

export function McpTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
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

  return (
    <div className="rounded-md border border-[#F5F5F5]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow className="" key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead 
                    className={`text-[#737373] text-sm font-medium bg-[#FAFAFA] ${index === 0 ? 'pr-0' : index === 1 ? 'pl-0' : ''}`} 
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
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    className={`h-14 ${index === 0 ? 'pr-3 w-[42px]' : index === 1 ? 'pl-0' : ''}`}
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
    </div>
  );
}