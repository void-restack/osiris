import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { WorkflowData } from "@/lib/store";
import type { Row } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { differenceInDays } from "date-fns";
import { Link } from "@tanstack/react-router";

interface MyWorkflowsGridViewProps {
    rows: Row<WorkflowData>[];
}

export function MyWorkflowsGridView({
    rows,
}: MyWorkflowsGridViewProps) {

    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 p-2 pb-24 sm:pb-28 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {rows.map((row) => {
                    const workflow = row.original;
                    const createdAt = new Date(workflow.createdAt);
                    const diffInDays = differenceInDays(new Date(), createdAt);


                    console.log(workflow, "!!!!!");

                    return (
                        <Link key={row.id} to={`/workflow/${workflow.id}`} className="group relative overflow-hidden rounded-md border border-primary-100 bg-white p-3">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Avatar className="size-10 shrink-0 rounded-sm">
                                        <AvatarImage
                                            src={workflow.imageUrl || workflow.coverImageUrl || undefined}
                                            alt={workflow.title}
                                        />
                                        <AvatarFallback className="text-sm rounded-sm font-medium bg-primary-100 text-primary-700">
                                            {workflow.title.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm text-primary-800 truncate line-clamp-1">
                                            {workflow.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {workflow.isPublic ? "Public" : "Private"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-primary-400 line-clamp-1">
                                {workflow.description}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

export const myWorkflowsGridViewColumns: any[] = [
    {
        id: "search",
        accessorKey: "title",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "text",
            label: "Workflow name",
            placeholder: "Search workflows...",
        },
    },
    {
        id: "visibility",
        accessorFn: (row: any) => row.isPublic ? "Public" : "Private",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "select",
            label: "Visibility",
            options: [
                { label: "Public", value: "Public" },
                { label: "Private", value: "Private" }
            ],
        },
    },
    {
        id: "trigger",
        accessorFn: (row: any) => row.timeBasedTrigger ? "Scheduled" : "Manual",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "select",
            label: "Trigger",
            options: [
                { label: "Scheduled", value: "Scheduled" },
                { label: "Manual", value: "Manual" }
            ],
        },
    },
];
