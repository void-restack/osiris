import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatQueries } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Edit, Calendar, Clock, User, Shield, ShieldCheck, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore, type WorkflowData } from "@/lib/store";
import { cn } from "@/lib/utils";

const WORKFLOW_FILTERS = [
    { label: "All", value: "all", icon: User },
    { label: "Public", value: "public", icon: Shield },
    { label: "Private", value: "private", icon: ShieldCheck },
    { label: "Scheduled", value: "scheduled", icon: Calendar },
    // { label: "Manual", value: "manual", icon: Clock },
] as const;

export default function WorkflowGrid() {
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div>
            <div className="flex flex-1 flex-col pt-4">
                {/* Header */}
                <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
                    <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
                        Add a Task or Workflow Description
                    </h2>
                    <span className="text-primary-300 text-sm">
                        Add context for your task or flow. Use @ to reference MCPs or agents.
                    </span>
                </div>

                {/* Simple Autocomplete */}
                <div className="px-4 mb-14 w-full mx-auto">
                    <Autocomplete
                        className="mt-6"
                        placeholder='Describe what you want to do…'
                        onSearch={() => []}
                        footerText="Recent workflows"
                        bottomRightContent={<></>}
                    />
                </div>

                {/* Workflow Grid with Header */}
                <div className="px-4 md:px-6 mb-24 sm:mb-28">
                    <div className="w-full max-w-full">
                        <WorkflowGridView
                            selectedFilter={selectedFilter}
                            onFilterChange={setSelectedFilter}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    </div>
                </div>

                {/* Bottom pagination */}
                <div className="sticky rounded-b-xl bottom-0 border-t border-t-primary-100 flex w-full items-center overflow-hidden bg-primary-00 px-4 sm:px-6 py-2 sm:py-3 z-40">
                    Workflow Footer
                </div>
            </div>
        </div>
    )
}

interface WorkflowGridViewProps {
    selectedFilter: string;
    onFilterChange: (filter: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function WorkflowGridView({ selectedFilter, onFilterChange, searchQuery, onSearchChange }: WorkflowGridViewProps) {
    const { user, isAuthenticated } = useAuth();
    const { openWorkflowEditSidebar } = useAppStore();

    // Fetch public workflows
    const { data: publicWorkflowsData, isLoading: isLoadingPublic, error: publicError } = useQuery(
        chatQueries.workflowsOptions({ isPublic: true, limit: 20 })
    );

    // Fetch user's private workflows (only if authenticated)
    const { data: privateWorkflowsData, isLoading: isLoadingPrivate, error: privateError } = useQuery({
        ...chatQueries.workflowsOptions({ isPublic: false, limit: 20 }),
        enabled: isAuthenticated, // Only fetch if user is logged in
    });

    // Combine, deduplicate, filter, and search workflows
    const workflows = useMemo(() => {
        const publicWorkflows = publicWorkflowsData?.data || [];
        const privateWorkflows = privateWorkflowsData?.data || [];

        // Combine workflows and remove duplicates (in case a workflow appears in both lists)
        const allWorkflows = [...publicWorkflows, ...privateWorkflows];
        const uniqueWorkflows = allWorkflows.filter((workflow, index, self) =>
            index === self.findIndex(w => w.id === workflow.id)
        );

        // Apply search filter first
        let searchFilteredWorkflows = uniqueWorkflows;
        if (searchQuery && searchQuery.length >= 2) {
            const query = searchQuery.toLowerCase();
            searchFilteredWorkflows = uniqueWorkflows.filter(workflow =>
                workflow.title.toLowerCase().includes(query) ||
                workflow.description.toLowerCase().includes(query) ||
                workflow.workflow.some((step: any) =>
                    step.name.toLowerCase().includes(query) ||
                    step.prompt.toLowerCase().includes(query)
                )
            );
        }

        // Apply filter
        let filteredWorkflows = searchFilteredWorkflows;
        switch (selectedFilter) {
            case "public":
                filteredWorkflows = searchFilteredWorkflows.filter(w => w.isPublic);
                break;
            case "private":
                filteredWorkflows = searchFilteredWorkflows.filter(w => !w.isPublic);
                break;
            case "scheduled":
                filteredWorkflows = searchFilteredWorkflows.filter(w => w.timeBasedTrigger);
                break;
            case "manual":
                filteredWorkflows = searchFilteredWorkflows.filter(w => !w.timeBasedTrigger);
                break;
            case "all":
            default:
                filteredWorkflows = searchFilteredWorkflows;
        }

        // Sort by creation date (newest first)
        return filteredWorkflows.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [publicWorkflowsData, privateWorkflowsData, selectedFilter, searchQuery]);

    const handleEditWorkflow = (workflow: WorkflowData) => {
        openWorkflowEditSidebar(workflow);
    };

    const isLoading = isLoadingPublic || (isAuthenticated && isLoadingPrivate);
    const error = publicError || privateError;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-primary-600">Loading workflows...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-600">Failed to load workflows. Please try again.</p>
            </div>
        );
    }

    if (workflows.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-primary-400">No workflows found. Create your first workflow!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                        Workflows
                    </span>
                    {(isLoading || error) && (
                        <div className="flex items-center gap-1">
                            {isLoading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />}
                        </div>
                    )}
                </div>

                <div className="flex w-full items-start md:items-center justify-end gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search workflows..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-8 w-40 lg:w-56 pl-8"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                {WORKFLOW_FILTERS.find(f => f.value === selectedFilter)?.label || "Filter"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {WORKFLOW_FILTERS.map((filter) => {
                                const IconComponent = filter.icon;
                                return (
                                    <DropdownMenuItem
                                        key={filter.value}
                                        onClick={() => onFilterChange(filter.value)}
                                        className={cn(
                                            "flex items-center gap-2",
                                            selectedFilter === filter.value && "bg-primary-50 text-primary-700"
                                        )}
                                    >
                                        <IconComponent className="h-4 w-4" />
                                        {filter.label}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
                <div className="grid w-full gap-6 pb-24 sm:pb-28 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className="relative group h-fit min-h-52 rounded-xl border border-primary-100 p-6  hover:border-primary-200 block cursor-pointer hover:bg-[#FAFAFA]"
                            style={{ zIndex: 1 }}
                            aria-label={`Go to ${workflow.title}`}
                            tabIndex={0}
                            role="link"
                            onClick={e => {
                                if (e.defaultPrevented) return;
                                // @ts-ignore
                                if (e.target.closest('.auth-method-dialog-trigger')) return;
                            }}
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                    // @ts-ignore
                                    if (e.target.closest('.auth-method-dialog-trigger')) return;
                                }
                            }}
                        >
                            <Link
                                to={`/workflow/${workflow.id}`}
                                className="absolute inset-0 z-10"
                                aria-label={`Go to ${workflow.title}`}
                                tabIndex={-1}
                                style={{ pointerEvents: "auto" }}
                            />
                            {/* Card Content */}
                            <div className="relative z-20 pointer-events-none">
                                {/* Header */}
                                <div className="mb-4 flex w-full items-start justify-between">
                                    <div className="flex flex-col items-start gap-3">
                                        <Avatar className="size-12 rounded-[6px]">
                                            <AvatarImage
                                                src={workflow.imageUrl ?? undefined}
                                                alt={workflow.title}
                                                className="rounded-[6px] bg-transparent"
                                            />
                                            <AvatarFallback className="rounded-[6px]">
                                                {workflow.title.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <h4 className="font-medium text-primary-800 capitalize flex items-center gap-2">
                                                {workflow.title}
                                                {workflow.isPublic ? (
                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                        Public
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                        Private
                                                    </span>
                                                )}
                                            </h4>
                                        </div>
                                    </div>
                                    {/* {isAuthenticated && (
                                        <div
                                            className="relative z-30 pointer-events-auto"
                                            onClick={e => {
                                                e.stopPropagation();
                                            }}
                                            onMouseDown={e => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => handleEditWorkflow(workflow)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )} */}
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <p className="text-primary-300 text-sm line-clamp-2 leading-relaxed">
                                        {workflow.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-primary-400">
                                        <span>{workflow.workflow.length} steps</span>
                                        {workflow.timeBasedTrigger && (
                                            <>
                                                <span>•</span>
                                                <span>Scheduled</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}