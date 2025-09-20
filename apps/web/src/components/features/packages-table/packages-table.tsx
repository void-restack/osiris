import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PackagesGridView } from "./packages-grid-view";
import { ICONS } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackagesEmptyState } from "./packages-empty-state";

interface PackagesTableProps {
    table: any;
    isLoading: boolean;
    isFetching: boolean;
    viewMode: "table" | "grid";
    onViewModeChange: (mode: "table" | "grid") => void;
    title?: string;
}

export function PackagesTable({
    table,
    isLoading,
    isFetching,
    viewMode,
    onViewModeChange,
    title
}: PackagesTableProps) {
    return (
        <div className="space-y-4">
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row pb-4">
                {title ?
                    <div className="flex items-center gap-2">
                        <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                            {title}
                        </span>
                        {isFetching && !isLoading && (
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                            </div>
                        )}
                    </div>
                    : null}

                <div className="flex w-full items-start md:items-center gap-2 justify-end flex-col md:flex-row">
                    {!isLoading && table.getRowModel().rows.length > 0 && (
                        <>
                            <DataTableToolbar className="w-full md:w-auto min-w-0" table={table} />
                            <ToggleGroup
                                className="rounded-[6px] bg-[#F5F5F5] p-[2px] h-8 self-stretch md:self-auto"
                                type="single"
                                value={viewMode}
                                onValueChange={(value) => onViewModeChange(value as "table" | "grid")}
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
                </div>
            </div>

            {table.getRowModel().rows.length === 0 ? (
                <PackagesEmptyState />
            ) : viewMode === "table" ? (
                <ScrollArea className="relative h-[calc(100vh-560px)] sm:h-[calc(100vh-600px)] hidebar overflow-y-auto">
                    <div className="w-full hidebar pb-8">
                        <DataTable table={table} />
                    </div>
                </ScrollArea>
            ) : (
                <PackagesGridView
                    rows={table.getPaginationRowModel().rows}
                />
            )}
        </div>
    );
}