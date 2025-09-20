import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Link } from "@tanstack/react-router";
import { Clock, Eye, MoreHorizontal } from "lucide-react";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkflowData } from "@/lib/store";

const WORKFLOW_FILTERS = [
    { label: "Public", value: "Public" },
    { label: "Private", value: "Private" },
] as const;

const TRIGGER_FILTERS = [
    { label: "Scheduled", value: "Scheduled" },
    { label: "Manual", value: "Manual" },
] as const;

export function useMyWorkflowsTableColumns() {

    return useMemo<ColumnDef<WorkflowData>[]>(
        () => [
            {
                id: "search",
                accessorKey: "title",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Workflow" />
                ),
                cell: ({ row }) => {
                    const workflow = row.original;
                    return (
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="size-8 rounded-md shrink-0">
                                <AvatarImage
                                    src={workflow.imageUrl || workflow.coverImageUrl || undefined}
                                    alt={workflow.title}
                                />
                                <AvatarFallback className="rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                    {workflow.title.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-[300px]">
                                <span className="font-medium text-sm text-primary-800 truncate max-w-[250px] lg:max-w-[300px] line-clamp-1">
                                    {workflow.title}
                                </span>
                            </div>
                        </div>
                    );
                },
                enableSorting: false,
                meta: {
                    variant: "text",
                    label: "Workflow name",
                    placeholder: "Search workflows...",
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
                    const workflow = row.original;
                    return (
                        <p className="text-xs text-primary-400 max-w-[200px] w-full truncate">
                            {workflow.description}
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
                    const workflow = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {workflow.isPublic ? "Public" : "Private"}
                            </Badge>
                        </div>
                    );
                },
                enableSorting: false,
                meta: {
                    variant: "select",
                    label: "Visibility",
                    options: WORKFLOW_FILTERS.map(filter => ({
                        label: filter.label,
                        value: filter.value,
                    })),
                },
            },
            {
                id: "trigger",
                accessorFn: (row) => row.timeBasedTrigger ? "Scheduled" : "Manual",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Trigger" />
                ),
                cell: ({ row }) => {
                    const workflow = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <Badge variant={workflow.timeBasedTrigger ? "default" : "outline"} className="text-xs">
                                {workflow.timeBasedTrigger ? "Scheduled" : "Manual"}
                            </Badge>
                        </div>
                    );
                },
                enableSorting: false,
                meta: {
                    variant: "select",
                    label: "Trigger",
                    options: TRIGGER_FILTERS.map(filter => ({
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
                    const workflow = row.original;
                    return (
                        <Badge variant="outline" className="font-mono text-xs">
                            {workflow.workflow.length} step{workflow.workflow.length !== 1 ? 's' : ''}
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
                            <Clock className="h-3 w-3 text-primary-400" />
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
                    const workflow = row.original;
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
                                        <Link to={`/workflow/${workflow.id}`}>
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
