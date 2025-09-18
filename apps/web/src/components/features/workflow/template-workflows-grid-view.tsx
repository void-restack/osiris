import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { TemplateWorkflowData } from "@/lib/store";
import type { Row } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { Clock, Eye, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateWorkflowsGridViewProps {
    rows: Row<TemplateWorkflowData>[];
}

export function TemplateWorkflowsGridView({
    rows,
}: TemplateWorkflowsGridViewProps) {
    const handleClone = (template: TemplateWorkflowData) => {
        console.log('Clone template:', template.id);
    };

    const handleShare = (template: TemplateWorkflowData) => {
        const url = `${window.location.origin}/template/${template.id}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 p-2 pb-24 sm:pb-28 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {rows.map((row) => {
                    const template = row.original;
                    const createdAt = new Date(template.createdAt);
                    const diffInDays = differenceInDays(new Date(), createdAt);

                    return (
                        <Link key={row.id} to={`/template/${template.id}`} className="group relative overflow-hidden rounded-md border border-primary-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Avatar className="size-10 rounded-sm shrink-0">
                                        <AvatarImage
                                            src={template.imageUrl || template.coverImageUrl || undefined}
                                            alt={template.title}
                                        />
                                        <AvatarFallback className="rounded-sm text-sm font-medium bg-primary-100 text-primary-700">
                                            {template.title.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm text-primary-800 truncate line-clamp-1">
                                            {template.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs rounded-sm">
                                                {template.isPublic ? "Public" : "Private"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-primary-400 truncate line-clamp-1">
                                {template.description}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

export const templateGridViewColumns: any[] = [
    {
        id: "search",
        accessorKey: "title",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "text",
            label: "Template name",
            placeholder: "Search templates...",
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
];
