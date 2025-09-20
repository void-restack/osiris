import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { OAuthClientsGridView } from "./oauth-clients-grid-view";
import { CreateOAuthClientDialog } from "./create-oauth-client-dialog";
import { ICONS } from "@/components/icons";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OAuthClientEmptyState } from "./oauth-clients-empty-state";
import { OAuthClientGridSkeleton } from "@/components/skeletons/oauth-skeleton";

interface OAuthClientsTableProps {
    table: any;
    isLoading: boolean;
    isFetching: boolean;
    viewMode?: "table" | "grid";
    onViewModeChange?: (mode: "table" | "grid") => void;
    title?: string;
}

export function OAuthClientsTable({
    table,
    isLoading,
    isFetching,
    viewMode: controlledViewMode,
    onViewModeChange,
    title = "OAuth Clients"
}: OAuthClientsTableProps) {
    const [internalViewMode, setInternalViewMode] = useState<"table" | "grid">("table");

    const viewMode = controlledViewMode ?? internalViewMode;
    const setViewMode = onViewModeChange ?? setInternalViewMode;

    return (
        <div className="space-y-4">
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row">

                <div className="flex w-full gap-2 items-center justify-end">
                    {!isLoading && table.getRowModel().rows.length > 0 && (
                        <>
                            <DataTableToolbar className="w-full" table={table} />

                            <ToggleGroup
                                className="rounded-[6px] bg-[#F5F5F5] p-[2px] h-8"
                                type="single"
                                value={viewMode}
                                onValueChange={(value) => setViewMode(value as "table" | "grid")}
                            >
                                <ToggleGroupItem
                                    value="table"
                                    className={cn(
                                        "hover:!bg-white/90 h-full",
                                        viewMode === "table" ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
                                    )}
                                >
                                    <ICONS.list stroke={viewMode === "table" ? "#000000" : "#A3A3A3"} />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="grid"
                                    className={cn(
                                        "hover:!bg-white/90 h-full",
                                        viewMode === "grid" ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
                                    )}
                                >
                                    <ICONS.directory stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"} />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </>
                    )}
                    <CreateOAuthClientDialog />
                </div>
            </div>
            <div className="relative h-[calc(100vh-500px)] hidebar overflow-y-auto">
                {isLoading ? (
                    <OAuthClientGridSkeleton />
                ) : table.getRowModel().rows.length === 0 ? (
                    <OAuthClientEmptyState />
                )
                    : viewMode === "table" ? (
                        <div className="w-full hidebar pb-8">
                            <DataTable table={table} />
                        </div>
                    ) : (
                        <OAuthClientsGridView rows={table.getRowModel().rows} />
                    )}
            </div>
        </div>
    );
}