import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowCreator } from "./workflow-creator";
import { TemplateWorkflowsTable } from "./template-workflows-table";
import { useTemplateWorkflowsTable } from "@/hooks/use-template-workflows-table";
import { useTemplateWorkflowsTableColumns } from "./template-workflows-table-columns";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { MyWorkflowsTable } from "./my-workflows-table";
import { useMyWorkflowsTable } from "@/hooks/use-my-workflows-table";
import { useMyWorkflowsTableColumns } from "./my-workflows-table-columns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ICONS } from "@/components/icons";
import { cn } from "@/lib/utils";
import { CreateTemplateWorkflowDialog } from "./create-workflow-dialog";

export default function WorkflowGrid() {
    const [activeTab, setActiveTab] = useState<string>("templates");
    const [templatesViewMode, setTemplatesViewMode] = useState<"table" | "grid">("grid");
    const [myWorkflowsViewMode, setMyWorkflowsViewMode] = useState<"table" | "grid">("grid");

    const templatesColumns = useTemplateWorkflowsTableColumns();
    const myWorkflowsColumns = useMyWorkflowsTableColumns();

    const templatesTableData = useTemplateWorkflowsTable({
        columns: templatesColumns,
        initialPageSize: 12,
    });

    const myWorkflowsTableData = useMyWorkflowsTable({
        columns: myWorkflowsColumns,
        initialPageSize: 12,
    });

    const handleWorkflowCreated = () => {
        console.log('Workflow created successfully!');
    };

    return (
        <div>
            <div className="flex flex-1 flex-col pt-4">
                {/* WorkflowCreator replaces all the autocomplete logic */}
                <div className="px-4 mb-14 w-full mx-auto">
                    <WorkflowCreator
                        className="mt-6"
                        onWorkflowCreated={handleWorkflowCreated}
                    />
                </div>

                {/* Workflow Grid with Tabs */}
                <div className="px-4 md:px-6 mb-24 sm:mb-28">
                    <div className="w-full max-w-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full z-10">
                            <div className="flex w-full items-center justify-between mb-6">
                                <TabsList className="flex items-center justify-start relative">
                                    <TabsTrigger value="templates">Templates</TabsTrigger>
                                    <TabsTrigger value="my-workflows">My Workflows</TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-4">
                                    <CreateTemplateWorkflowDialog />
                                    {activeTab === "templates" && (
                                        <TemplatesFilters
                                            viewMode={templatesViewMode}
                                            onViewModeChange={setTemplatesViewMode}
                                            table={templatesTableData.table}
                                        />
                                    )}
                                    {activeTab === "my-workflows" && (
                                        <MyWorkflowsFilters
                                            viewMode={myWorkflowsViewMode}
                                            onViewModeChange={setMyWorkflowsViewMode}
                                            table={myWorkflowsTableData.table}
                                        />
                                    )}
                                </div>
                            </div>

                            <TabsContent value="templates">
                                <TemplateWorkflowGridView
                                    viewMode={templatesViewMode}
                                    onViewModeChange={setTemplatesViewMode}
                                    tableData={templatesTableData}
                                />
                            </TabsContent>

                            <TabsContent value="my-workflows">
                                <MyWorkflowsGridView
                                    viewMode={myWorkflowsViewMode}
                                    onViewModeChange={setMyWorkflowsViewMode}
                                    tableData={myWorkflowsTableData}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-0 z-40 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6">
                {activeTab === "templates" && (
                    <DataTablePagination table={templatesTableData.table} />
                )}
                {activeTab === "my-workflows" && (
                    <DataTablePagination table={myWorkflowsTableData.table} />
                )}
            </div>
        </div>
    )
}


function TemplatesFilters({ viewMode, onViewModeChange, table }: { viewMode: "table" | "grid", onViewModeChange: (mode: "table" | "grid") => void, table: any }) {
    return (
        <div className="flex items-center gap-2">
            <DataTableToolbar table={table}>
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
                        <ICONS.directory stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"} />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="table"
                        aria-label="Toggle table view"
                        className={cn(
                            "h-8 w-8 p-0",
                            viewMode === "table" && "bg-primary-100"
                        )}
                    >
                        <ICONS.list stroke={viewMode === "table" ? "#000000" : "#A3A3A3"} />
                    </ToggleGroupItem>
                </ToggleGroup>
            </DataTableToolbar>
        </div>
    );
}

function MyWorkflowsFilters({ viewMode, onViewModeChange, table }: { viewMode: "table" | "grid", onViewModeChange: (mode: "table" | "grid") => void, table: any }) {
    return (
        <div className="flex items-center gap-2">
            <DataTableToolbar table={table}>
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
                        <ICONS.directory stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"} />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="table"
                        aria-label="Toggle table view"
                        className={cn(
                            "h-8 w-8 p-0",
                            viewMode === "table" && "bg-primary-100"
                        )}
                    >
                        <ICONS.list stroke={viewMode === "table" ? "#000000" : "#A3A3A3"} />
                    </ToggleGroupItem>
                </ToggleGroup>
            </DataTableToolbar>
        </div>
    );
}

export function MyWorkflowsGridView({ viewMode, onViewModeChange, tableData }: { viewMode: "table" | "grid", onViewModeChange: (mode: "table" | "grid") => void, tableData: any }) {
    return (
        <div className="w-full">
            <MyWorkflowsTable
                table={tableData.table}
                isLoading={tableData.isLoading}
                isFetching={tableData.isFetching}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                showHeader={false}
            />
        </div>
    );
}

export function TemplateWorkflowGridView({ viewMode, onViewModeChange, tableData }: { viewMode: "table" | "grid", onViewModeChange: (mode: "table" | "grid") => void, tableData: any }) {
    return (
        <div className="w-full">
            <TemplateWorkflowsTable
                table={tableData.table}
                isLoading={tableData.isLoading}
                isFetching={tableData.isFetching}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                showHeader={false}
            />
        </div>
    );
}