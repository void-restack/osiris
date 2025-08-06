import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { PackageList } from "@/types";
import { format } from "date-fns";
import { Download, ExternalLink, MoreHorizontal, Share2 } from "lucide-react";
import type { Row } from "@tanstack/react-table";

interface PackagesGridViewProps {
    rows: Row<PackageList>[];
    onInstall: (pkg: PackageList) => void;
    onViewPackage: (pkg: PackageList) => void;
    onShare: (pkg: PackageList) => void;
}

export function PackagesGridView({
    rows,
    onInstall,
    onViewPackage,
    onShare
}: PackagesGridViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rows.map((row) => {
                const pkg = row.original;
                const name = pkg.name || (pkg as any).packageName;
                const description = pkg.description || (pkg as any).packageDescription;
                const version = pkg.latestVersion || (pkg as any).packageLatestVersion;
                const iconUrl = pkg.iconUrl || (pkg as any).packageIconUrl;
                return (
                    <Card key={row.id} className="group hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Avatar className="h-10 w-10 shrink-0 border">
                                        <AvatarImage src={iconUrl || undefined} alt={name} />
                                        <AvatarFallback className="text-xs font-medium bg-primary-100 text-primary-700">
                                            {name?.charAt(0).toUpperCase() || 'P'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-sm font-medium text-primary-800 truncate">
                                            {name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                v{version}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onViewPackage(pkg)}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Package
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onShare(pkg)}>
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Copy URL
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0 pb-3">
                            <CardDescription className="text-sm text-primary-500 leading-relaxed" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {description}
                            </CardDescription>

                            <div className="flex items-center justify-between mt-3 text-xs text-primary-400">
                                <span>Created {pkg.createdAt ? format(new Date(pkg.createdAt), "MMM d, yyyy") : "N/A"}</span>
                                <span>Updated {pkg.updatedAt ? format(new Date(pkg.updatedAt), "MMM d, yyyy") : "N/A"}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                    {pkg.paymentConfig ? "Paid" : "Free"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {(pkg as any).packageType || pkg.type || "MCP"}
                                </Badge>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-0">
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => onInstall(pkg)}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Install
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

// Grid view columns definition (includes search for filtering)
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