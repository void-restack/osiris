import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TemplateWorkflowData } from "@/lib/store";
import type { Row } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";

interface TemplateWorkflowsGridViewProps {
    rows: Row<TemplateWorkflowData>[];
}

export function TemplateWorkflowsGridView({
    rows,
}: TemplateWorkflowsGridViewProps) {
    const allPackageIds = useMemo(() => {
        const ids = new Set<string>();
        rows.forEach((row) => {
            const wf = (row.original as any)?.workflow || [];
            wf.forEach((step: any) => {
                const stepIds = step.packageIds || [];
                stepIds.forEach((id: string) => ids.add(id));
            });
        });
        return Array.from(ids);
    }, [rows]);

    const packageQueriesData = useQueries({
        queries: allPackageIds.map((id) => packageQueries.detailOptions(id)),
    });

    const packageMap = useMemo(() => {
        const map = new Map<string, any>();
        allPackageIds.forEach((id, index) => {
            const q = packageQueriesData[index];
            if (q && q.data) map.set(id, q.data);
        });
        return map;
    }, [allPackageIds, packageQueriesData]);

    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 p-2 pb-24 sm:pb-28 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {rows.map((row) => {
                    const template = row.original;
                    const createdAt = new Date(template.createdAt);
                    // const diffInDays = differenceInDays(new Date(), createdAt);

                    return (
                        <Link key={row.id} to={`/template/${template.id}`} className="relative group min-h-[200px] overflow-hidden rounded-xl border border-primary-100 bg-white p-3">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex flex-col items-start mb-12 gap-3 min-w-0 flex-1">
                                    {(() => {
                                        const stepIds: string[] = Array.from(new Set((template.workflow || []).flatMap((s: any) => s.packageIds || [])));
                                        const pkgs = stepIds.slice(0, 3).map(id => packageMap.get(id)).filter(Boolean);

                                        if (pkgs.length === 0) {
                                            return (
                                                <Avatar className="size-12 shrink-0">
                                                    <AvatarImage
                                                        src={template.imageUrl || template.coverImageUrl || undefined}
                                                        alt={template.title}
                                                    />
                                                    <AvatarFallback className="text-xs font-medium bg-primary-100 text-primary-700">
                                                        {template.title.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            );
                                        }

                                        return (
                                            <div className="relative size-14 shrink-0">
                                                {pkgs.length === 1 ? (
                                                    <Avatar className="size-12 rounded-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                        <AvatarImage src={pkgs[0]?.iconUrl || undefined} alt={pkgs[0]?.name} />
                                                        <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700">
                                                            {pkgs[0]?.name?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ) : pkgs.length === 2 ? (
                                                    <>
                                                        <Avatar className="size-7 absolute top-1/2 left-6 -translate-y-1/6">
                                                            <AvatarImage src={pkgs[0]?.iconUrl || undefined} alt={pkgs[0]?.name} />
                                                            <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700">
                                                                {pkgs[0]?.name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <Avatar className="size-7 absolute">
                                                            <AvatarImage src={pkgs[1]?.iconUrl || undefined} alt={pkgs[1]?.name} />
                                                            <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700">
                                                                {pkgs[1]?.name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Avatar className="size-6 absolute top-1 left-1/2 -translate-x-1/2">
                                                            <AvatarImage src={pkgs[0]?.iconUrl || undefined} alt={pkgs[0]?.name} />
                                                            <AvatarFallback className="rounded-full text-[10px] bg-primary-100 text-primary-700">
                                                                {pkgs[0]?.name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <Avatar className="size-6 absolute bottom-1 left-1">
                                                            <AvatarImage src={pkgs[1]?.iconUrl || undefined} alt={pkgs[1]?.name} />
                                                            <AvatarFallback className="rounded-full text-[10px] bg-primary-100 text-primary-700">
                                                                {pkgs[1]?.name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <Avatar className="size-6 ring-1 ring-white absolute bottom-1 right-1">
                                                            <AvatarImage src={pkgs[2]?.iconUrl || undefined} alt={pkgs[2]?.name} />
                                                            <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700">
                                                                {pkgs[2]?.name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-[15px] text-primary-800 truncate line-clamp-1">
                                            {template.title}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-primary-300 line-clamp-3 absolute bottom-4 left-3 right-3 text-wrap">
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
