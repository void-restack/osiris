import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { TemplateWorkflowsGridView } from "./template-workflows-grid-view";
import { ICONS } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemplateWorkflowsTableProps {
    table: any;
    isLoading: boolean;
    isFetching: boolean;
    viewMode: "table" | "grid";
    onViewModeChange: (mode: "table" | "grid") => void;
    title?: string;
    showHeader?: boolean;
}

export function TemplateWorkflowsTable({
    table,
    isLoading,
    isFetching,
    viewMode,
    onViewModeChange,
    title = "All Templates",
    showHeader = true
}: TemplateWorkflowsTableProps) {

    return (
        <div className="w-full space-y-4">
            {showHeader && (
                <div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-primary-800">
                            {title}
                        </h3>
                        {isFetching && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <DataTableToolbar table={table}>
                            <div className="flex items-center gap-2">
                                <ToggleGroup
                                    type="single"
                                    value={viewMode}
                                    onValueChange={(value) => {
                                        if (value) onViewModeChange(value as "table" | "grid");
                                    }}
                                    className="border border-primary-200"
                                >
                                    <ToggleGroupItem
                                        value="grid"
                                        aria-label="Toggle grid view"
                                        className={cn(
                                            "h-8 w-8 p-0",
                                            viewMode === "grid" && "bg-primary-100"
                                        )}
                                    >
                                        <ICONS.directory className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="table"
                                        aria-label="Toggle table view"
                                        className={cn(
                                            "h-8 w-8 p-0",
                                            viewMode === "table" && "bg-primary-100"
                                        )}
                                    >
                                        <ICONS.list className="h-4 w-4" />
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </DataTableToolbar>
                    </div>
                </div>
            )}

            {viewMode === "table" ? (
                <ScrollArea className="relative h-[calc(100vh-560px)] sm:h-[calc(100vh-600px)] hidebar overflow-y-auto">
                    <div className="w-full hidebar pb-8">
                        <DataTable table={table} />
                    </div>
                </ScrollArea>
            ) : (
                <TemplateWorkflowsGridView
                    rows={table.getPaginationRowModel().rows}
                />
            )}
        </div>
    );
}
