import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Link } from "@tanstack/react-router";
import { Clock, Eye, Share2, MoreHorizontal } from "lucide-react";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemplateWorkflowData } from "@/lib/store";

const TEMPLATE_FILTERS = [
    { label: "Public", value: "Public" },
    { label: "Private", value: "Private" },
] as const;

export function useTemplateWorkflowsTableColumns() {

    return useMemo<ColumnDef<TemplateWorkflowData>[]>(
        () => [
            {
                id: "search",
                accessorKey: "title",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Template" />
                ),
                cell: ({ row }) => {
                    const template = row.original;
                    return (
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="size-8 rounded-md shrink-0">
                                <AvatarImage
                                    src={template.imageUrl || template.coverImageUrl || undefined}
                                    alt={template.title}
                                />
                                <AvatarFallback className="rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                    {template.title.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-[300px]">
                                <span className="font-medium text-sm text-primary-800 truncate max-w-[250px] lg:max-w-[300px] line-clamp-1">
                                    {template.title}
                                </span>
                            </div>
                        </div>
                    );
                },
                enableSorting: false,
                meta: {
                    variant: "text",
                    label: "Template name",
                    placeholder: "Search templates...",
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
                    const template = row.original;
                    return (
                        <p className="text-xs text-primary-400 max-w-[200px] w-full truncate">
                            {template.description}
                        </p>
                    );
                },
            },
            {
                id: "visibility",
                accessorFn: (row) => row.isPublic ? "Public" : "Private",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Visibility" />
                ),
                cell: ({ row }) => {
                    const template = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {template.isPublic ? "Public" : "Private"}
                            </Badge>
                        </div>
                    );
                },
                enableSorting: false,
                meta: {
                    variant: "select",
                    label: "Visibility",
                    options: TEMPLATE_FILTERS.map(filter => ({
                        label: filter.label,
                        value: filter.value,
                    })),
                },
            },
            {
                id: "steps",
                accessorKey: "workflow",
                enableColumnFilter: false,
                enableSorting: false,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Steps" />
                ),
                cell: ({ row }) => {
                    const template = row.original;
                    return (
                        <Badge variant="outline" className="font-mono text-xs">
                            {template.workflow.length} step{template.workflow.length !== 1 ? 's' : ''}
                        </Badge>
                    );
                },
            },
            {
                id: "createdAt",
                accessorKey: "createdAt",
                enableColumnFilter: false,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Created" />
                ),
                enableSorting: false,
                cell: ({ row }) => {
                    const createdAt = new Date(row.getValue("createdAt") as string);
                    const diffInDays = differenceInDays(new Date(), createdAt);

                    return (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-primary-600">
                                {diffInDays === 0
                                    ? "Today"
                                    : diffInDays === 1
                                        ? "Yesterday"
                                        : formatDistanceToNow(createdAt, { addSuffix: true })
                                }
                            </span>
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: () => <div className="text-right pr-2 md:pr-6">Actions</div>,
                cell: ({ row }) => {
                    const template = row.original;
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
                                        <Link to={`/template/${template.id}`}>
                                            <Eye className="h-3 w-3 mr-2" />
                                            View Details
                                        </Link>
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
        []
    );
}
