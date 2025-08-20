import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { OAuthClientsGridView } from "./oauth-clients-grid-view";
import { CreateOAuthClientDialog } from "./create-oauth-client-dialog";
import { ICONS } from "@/components/icons";
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

    // Use controlled mode if provided, otherwise use internal state
    const viewMode = controlledViewMode ?? internalViewMode;
    const setViewMode = onViewModeChange ?? setInternalViewMode;

    return (
        <div className="space-y-4">
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4">
                <div className="flex items-center gap-4">
                    <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                        {title}
                    </span>

                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                        </div>
                    )}
                </div>

                <div className="flex w-full gap-2 items-center justify-end">
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

                    <CreateOAuthClientDialog />
                </div>
            </div>

            {viewMode === "table" ? (
                <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto">
                    <div className="w-full hidebar pb-8">
                        <DataTable table={table} />
                    </div>
                </ScrollArea>
            ) : (
                <OAuthClientsGridView rows={table.getRowModel().rows} />
            )}
        </div>
    );
}