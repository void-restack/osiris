import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PackageList } from "@/types";
import type { Row } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";

interface PackagesGridViewProps {
    rows: Row<PackageList>[];
}

export function PackagesGridView({
    rows,
}: PackagesGridViewProps) {
    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 p-2 pb-24 sm:pb-28 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {rows.map((row) => {
                    const pkg = row.original;
                    const name = pkg.name || (pkg as any).packageName;
                    const description = pkg.shortDescription || pkg.description || (pkg as any).packageDescription;
                    const version = pkg.latestVersion || (pkg as any).packageLatestVersion;
                    const iconUrl = pkg.iconUrl || (pkg as any).packageIconUrl;

                    return (
                        <Link to={`/mcp/${pkg.packageId}`} key={row.id} className="min-h-[200px] group hover:shadow-md transition-shadow duration-200 p-3 inset-shadow-card rounded-xl bg-primary-00 opacity-100 w-full relative overflow-hidden">
                            <div className="p-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col items-start gap-3 min-w-0 flex-1" >
                                        <Avatar className="size-12 rounded-md shrink-0">
                                            <AvatarImage src={iconUrl || undefined} alt={name} />
                                            <AvatarFallback className="size-12 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                                {name?.charAt(0).toUpperCase() || 'P'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-medium text-primary-800 truncate">
                                                {String(name).toWellFormed()}
                                            </h4>
                                            <p className="text-[13px] text-primary-300">
                                                v{version}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        <Badge variant="secondary" className="text-xs rounded-[6px] text-[13px]">
                                            {(pkg as any).packageType || pkg.type || "MCP"}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs uppercase rounded-[6px] text-[13px]">
                                            {pkg.paymentConfig ? "Paid" : "Free"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="p-0 absolute bottom-4 left-3 right-3 text-wrap text-sm text-primary-300 line-clamp-3">
                                {description}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </ScrollArea>

    );
}

export const gridViewColumns: any[] = [
    {
        id: "search",
        accessorKey: "name",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "text",
            label: "Package name",
            placeholder: "Search packages...",
        },
    },
    {
        id: "type",
        accessorKey: "type",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "multiSelect",
            label: "Package type",
            options: [{ label: "MCP Package", value: "mcp" }],
        },
    },
    {
        id: "pricing",
        accessorFn: (row: any) => row.paymentConfig ? "Paid" : "Free",
        enableColumnFilter: true,
        header: () => null,
        cell: () => null,
        meta: {
            variant: "select",
            label: "Pricing",
            options: [
                { label: "Free", value: "Free" },
                { label: "Paid", value: "Paid" }
            ],
        },
    },
];