import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { PackageDialog } from "./package-dialog";
import type { Package } from "@/types";
import { formatDistanceToNow } from "date-fns";

export const createMcpColumns = (): ColumnDef<Package>[] => [
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Package" />
    ),
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-md bg-blue-400 flex items-center justify-center text-white font-bold text-sm">
          {row.original.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-primary-800">
            {row.original.name}
          </span>
          <span className="text-primary-400 text-xs">v{row.original.latestVersion}</span>
        </div>
      </div>
    ),
    enableHiding: false,
    enableSorting: true,
    meta: {
      variant: "text",
      label: "Package Name",
      placeholder: "Search packages...",
    },
  },
  {
    id: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    accessorKey: "description",
    cell: ({ row }) => (
      <div className="text-primary-400 text-sm max-w-xs truncate" title={row.original.description}>
        {row.original.description}
      </div>
    ),
    enableSorting: false,
    meta: {
      variant: "text",
      label: "Description",
      placeholder: "Search descriptions...",
    },
  },
  {
    id: "publisher",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Publisher" />
    ),
    accessorKey: "publisherId",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold">
          P
        </div>
        <span className="text-sm text-primary-600">{row.original.publisherId}</span>
      </div>
    ),
    enableSorting: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      variant: "text",
      label: "Publisher",
      placeholder: "Search publishers...",
    },
  },
  {
    id: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    accessorKey: "metadata.tags",
    cell: ({ row }) => {
      const tags = row.original.metadata?.tags || [];
      return (
        <div className="flex flex-wrap gap-1 max-w-40">
          {tags.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[13px] rounded-[6px] font-medium text-primary-400">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-[13px] rounded-[6px] font-medium text-primary-400">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
    filterFn: (row, id, value) => {
      const tags = row.original.metadata?.tags || [];
      return value.some((v: string) =>
        tags.some((tag: string) => tag.toLowerCase().includes(v.toLowerCase()))
      );
    },
    meta: {
      variant: "text",
      label: "Tags",
      placeholder: "Search tags...",
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    accessorKey: "isActive",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? "default" : "secondary"}
        className="capitalize rounded-[6px] text-[13px] font-medium"
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
    enableSorting: false,
    filterFn: (row, id, value) => {
      const status = row.original.isActive ? "active" : "inactive";
      return value.includes(status);
    },
    meta: {
      variant: "multiSelect",
      label: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  },
  {
    id: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <div className="text-sm text-primary-400">
        {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
      </div>
    ),
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.createdAt).getTime() - new Date(rowB.original.createdAt).getTime();
    },
    meta: {
      variant: "dateRange",
      label: "Created Date",
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <PackageDialog
          package={row.original}
          trigger={
            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-[6px]">
              Install
            </Button>
          }
        />
        <Link to={`/mcp/${row.original.packageId}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-[6px]">
            View
          </Button>
        </Link>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
