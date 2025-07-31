import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { AuthMethodDialog } from "./auth-method-dialog";
import type { ServiceClient } from "@/types/auth";
import { formatDistanceToNow } from "date-fns";

export const createColumns = (): ColumnDef<ServiceClient>[] => [
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-md bg-purple-400 flex items-center justify-center text-white font-bold text-sm capitalize">
          {row.original.name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-primary-800 capitalize">
            {row.original.name}
          </span>
          <span className="text-primary-400 text-xs">{row.original.type}</span>
        </div>
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
    meta: {
      variant: "text",
      label: "Name",
      placeholder: "Search names...",
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
    id: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    accessorKey: "type",
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize rounded-[6px] text-primary-400 text-[13px] font-medium">
        {row.original.type.replace('_', ' ')}
      </Badge>
    ),
    enableSorting: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      variant: "multiSelect",
      label: "Type",
      options: [
        { label: "OAuth", value: "oauth" },
        { label: "Secret Sharing", value: "secret_sharing" },
        { label: "Embedded Wallet", value: "embedded_wallet" },
      ],
    },
  },
  {
    id: "scopes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scopes" />
    ),
    accessorKey: "scopeDefinitions",
    cell: ({ row }) => {
      const scopeCount = Object.keys(row.original.scopeDefinitions).length;
      return (
        <div className="flex items-center gap-2">
          <span className="text-primary-400 text-sm">
            {scopeCount} scopes
          </span>
          {/* {scopeCount > 5 && ( */}
          {/*   <Badge variant="outline" className="text-xs"> */}
          {/*     High */}
          {/*   </Badge> */}
          {/* )} */}
        </div>
      );
    },
    enableSorting: false,
    sortingFn: (rowA, rowB) => {
      const scopesA = Object.keys(rowA.original.scopeDefinitions).length;
      const scopesB = Object.keys(rowB.original.scopeDefinitions).length;
      return scopesA - scopesB;
    },
    meta: {
      variant: "range",
      label: "Scopes",
      range: [0, 20],
    },
  },
  {
    id: "services",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Services" />
    ),
    accessorKey: "supportedServices",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-40">
        {row.original.supportedServices.slice(0, 1).map((service) => (
          <Badge key={service} variant="secondary" className="text-[13px] rounded-[6px] font-medium text-primary-400">
            {service}
          </Badge>
        ))}
        {row.original.supportedServices.length > 2 && (
          <Badge variant="outline" className="text-[13px] rounded-[6px] font-medium text-primary-400">
            +{row.original.supportedServices.length - 2}
          </Badge>
        )}
      </div>
    ),
    enableSorting: false,
    sortingFn: (rowA, rowB) => {
      return rowA.original.supportedServices.length - rowB.original.supportedServices.length;
    },
    filterFn: (row, id, value) => {
      const services = row.original.supportedServices;
      return value.some((v: string) =>
        services.some((service: string) =>
          service.toLowerCase().includes(v.toLowerCase())
        )
      );
    },
    meta: {
      variant: "text",
      label: "Services",
      placeholder: "Search services...",
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
    enableSorting: false,
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
        <AuthMethodDialog method={row.original} />
        <Link to={`/auth/${row.original.clientId}`}>
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
