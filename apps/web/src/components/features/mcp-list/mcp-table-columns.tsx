import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { PackageWithUserStatus } from "@/types";
import { McpDeployDialog } from "@/components/mcp-deploy-dialog";
import { CheckCircle, ExternalLink } from "lucide-react";

export const createMcpColumns = (): ColumnDef<PackageWithUserStatus>[] => [
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Package" />
    ),
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.iconUrl ? (
          <img
            src={row.original.iconUrl}
            alt={row.original.name}
            className="size-8 rounded-md object-cover"
          />
        ) : (
          <div className="size-8 rounded-md bg-blue-400 flex items-center justify-center text-white font-bold text-sm">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary-800">
              {row.original.name}
            </span>
          </div>
          <span className="text-primary-400 text-xs">v{row.original.latestVersion}</span>
        </div>
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
    enableColumnFilter: true,
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
    enableColumnFilter: true,
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
          {row.original.publisherId?.charAt(0).toUpperCase() || "P"}
        </div>
        <span className="text-sm text-primary-600 truncate max-w-24" title={row.original.publisherId}>
          {row.original.publisherId?.split('-')[0] || "Unknown"}...
        </span>
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: {
      variant: "text",
      label: "Publisher",
      placeholder: "Search publishers...",
    },
  },
  // {
  //   id: "tags",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Tags" />
  //   ),
  //   accessorKey: "metadata.tags",
  //   cell: ({ row }) => {
  //     const tags = row.original.metadata?.tags || [];
  //     if (tags.length === 0) {
  //       return <span className="text-primary-300 text-sm">No tags</span>;
  //     }
  //     return (
  //       <div className="flex flex-wrap gap-1 max-w-40">
  //         {tags.slice(0, 2).map((tag: string) => (
  //           <Badge key={tag} variant="secondary" className="text-[13px] rounded-[6px] font-medium text-primary-400">
  //             {tag}
  //           </Badge>
  //         ))}
  //         {tags.length > 2 && (
  //           <Badge variant="outline" className="text-[13px] rounded-[6px] font-medium text-primary-400">
  //             +{tags.length - 2}
  //           </Badge>
  //         )}
  //       </div>
  //     );
  //   },
  //   enableSorting: false,
  //   enableColumnFilter: true,
  //   filterFn: (row, id, value) => {
  //     const tags = row.original.metadata?.tags || [];
  //     return value.some((v: string) =>
  //       tags.some((tag: string) => tag.toLowerCase().includes(v.toLowerCase()))
  //     );
  //   },
  //   meta: {
  //     variant: "text",
  //     label: "Tags",
  //     placeholder: "Search tags...",
  //   },
  // },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    accessorKey: "isActive",
    cell: ({ row }) => {
      const { isInstalled, isDeployed, isActive } = row.original;

      if (isDeployed) {
        return (
          <Badge variant="default" className="capitalize rounded-[6px] text-[13px] font-medium bg-blue-100 text-blue-800">
            Deployed
          </Badge>
        );
      }

      if (isInstalled) {
        return (
          <Badge variant="default" className="capitalize rounded-[6px] text-[13px] font-medium bg-green-100 text-green-800">
            Installed
          </Badge>
        );
      }

      return (
        <Badge
          variant={isActive ? "secondary" : "outline"}
          className="capitalize rounded-[6px] text-[13px] font-medium"
        >
          {isActive ? "Available" : "Inactive"}
        </Badge>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const { isInstalled, isDeployed, isActive } = row.original;
      const status = isDeployed ? "deployed" : isInstalled ? "installed" : isActive ? "available" : "inactive";
      return value.includes(status);
    },
    meta: {
      variant: "multiSelect",
      label: "Status",
      options: [
        { label: "Available", value: "available" },
        { label: "Installed", value: "installed" },
        { label: "Deployed", value: "deployed" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  },
  // {
  //   id: "createdAt",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Created" />
  //   ),
  //   accessorKey: "createdAt",
  //   cell: ({ row }) => {
  //     if (!row.original.createdAt) {
  //       return <span className="text-primary-300 text-sm">Unknown</span>;
  //     }
  //     return (
  //       <div className="text-sm text-primary-400">
  //         {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
  //       </div>
  //     );
  //   },
  //   enableSorting: true,
  //   enableColumnFilter: true,
  //   sortingFn: (rowA, rowB) => {
  //     const dateA = rowA.original.createdAt ? new Date(rowA.original.createdAt).getTime() : 0;
  //     const dateB = rowB.original.createdAt ? new Date(rowB.original.createdAt).getTime() : 0;
  //     return dateA - dateB;
  //   },
  //   meta: {
  //     variant: "dateRange",
  //     label: "Created Date",
  //   },
  // },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {!row.original.isDeployed ? (
          <McpDeployDialog
            package={row.original}
            trigger={
              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-[6px]">
                Deploy
              </Button>
            }
          />
        ) : (
          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-[6px]" disabled>
            Deployed
          </Button>
        )}
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
