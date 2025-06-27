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

import { Mail, Reply, Send } from "lucide-react";
import { ICONS } from "@/components/icons";
import { McpTag } from "@/components/tag";
import { Link } from "@tanstack/react-router";

interface Capability {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const capabilities: Capability[] = [
  {
    id: "draft_email",
    title: "Draft an Email",
    description: "Draft an Email to recipients that can be scheduled",
    icon: Mail,
  },
  {
    id: "send_message",
    title: "Send an Email",
    description: "Draft an Email to recipients that can...",
    icon: Send,
  },
  {
    id: "reply_to_emails",
    title: "Reply to Emails",
    description: "Reply to an Email to recipients that can be scheduled to be sent at a later date",
    icon: Reply,
  },
  {
    id: "draft_email",
    title: "Draft an Email",
    description: "Draft an Email to recipients that can be scheduled to be sent at a later date",
    icon: Mail,
  },
  {
    id: "draft_email",
    title: "Draft an Email",
    description: "Draft an Email to recipients that can be scheduled to be sent at a later date",
    icon: Mail,
  },
];

export const columns: ColumnDef<Capability>[] = [
  {
    accessorKey: "id",
    header: () => {
      return (
        <div className="flex items-center gap-2">
          <ICONS.cap />
          <p>MCP Capabilities</p>
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-4">
          <div className="bg-primary-50 rounded-[8px] h-9 w-9 flex items-center justify-center">
            <row.original.icon className="stroke-primary-400 h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-medium text-primary-800">{row.original.title}</h1>
            <p className="text-xs text-primary-300">{row.original.description}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "",
    cell: ({ row }) => (
        <div className="flex items-center gap-3 justify-end px-8">
            <McpTag tag={row.original.id} />
            <Button variant="secondary" className="h-6 w-5 rounded shadow-none">
                <MoveUpRight className="h-[14px] w-[14px] stroke-primary-400 bg-primary-50" />
            </Button>
        </div>
    ),
  },
];

export function McpCapabilitiesList({ data }: { data: Capability[] }) {
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
    <div className="rounded-md border border-primary-50">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow className="" key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead key={header.id}>
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
                  <TableCell key={cell.id}>
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
