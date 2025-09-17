import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { chatQueries } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User, Shield, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore, type WorkflowData, type TemplateWorkflowData } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CreateTemplateWorkflowDialog } from "./create-workflow-dialog";
import { WorkflowCreator } from "./workflow-creator";

const WORKFLOW_FILTERS = [
    { label: "All", value: "all", icon: User },
    { label: "Public", value: "public", icon: Shield },
] as const;

export default function WorkflowGrid() {
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string>("templates");

    const handleWorkflowCreated = () => {
        // Handle successful workflow creation
        // You can add toast notifications, refresh queries, etc.
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
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full mb-6">
                                <TabsTrigger value="templates">Templates</TabsTrigger>
                                <TabsTrigger value="my-workflows">My Workflows</TabsTrigger>
                            </TabsList>

                            <TabsContent value="templates">
                                <TemplateWorkflowGridView
                                    selectedFilter={selectedFilter}
                                    onFilterChange={setSelectedFilter}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                />
                            </TabsContent>

                            <TabsContent value="my-workflows">
                                <WorkflowGridView
                                    selectedFilter={selectedFilter}
                                    onFilterChange={setSelectedFilter}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Bottom pagination */}
                <div className="sticky rounded-b-xl bottom-0 border-t border-t-primary-100 flex w-full items-center overflow-hidden bg-primary-00 px-4 sm:px-6 py-2 sm:py-3 z-40">
                    {/* Workflow Footer */}
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

interface TemplateWorkflowGridViewProps {
    selectedFilter: string;
    onFilterChange: (filter: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function WorkflowGridView({ selectedFilter, onFilterChange, searchQuery, onSearchChange }: WorkflowGridViewProps) {
    const { user, isAuthenticated } = useAuth();
    const { openWorkflowEditSidebar } = useAppStore();

    // Fetch user's workflows using the new myWorkflowsOptions query
    const { data: workflowsData, isLoading, error } = useQuery({
        ...chatQueries.myWorkflowsOptions(),
        enabled: isAuthenticated, // Only fetch if user is logged in
    });

    // Filter and search workflows
    const workflows = useMemo(() => {
        const allWorkflows = workflowsData?.data || [];

        // Apply search filter first
        let searchFilteredWorkflows = allWorkflows;
        if (searchQuery && searchQuery.length >= 2) {
            const query = searchQuery.toLowerCase();
            searchFilteredWorkflows = allWorkflows.filter((workflow: WorkflowData) =>
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
                filteredWorkflows = searchFilteredWorkflows.filter((w: WorkflowData) => w.isPublic);
                break;
            case "private":
                filteredWorkflows = searchFilteredWorkflows.filter((w: WorkflowData) => !w.isPublic);
                break;
            case "scheduled":
                filteredWorkflows = searchFilteredWorkflows.filter((w: WorkflowData) => w.timeBasedTrigger);
                break;
            case "manual":
                filteredWorkflows = searchFilteredWorkflows.filter((w: WorkflowData) => !w.timeBasedTrigger);
                break;
            case "all":
            default:
                filteredWorkflows = searchFilteredWorkflows;
        }

        // Sort by creation date (newest first)
        return filteredWorkflows.sort((a: WorkflowData, b: WorkflowData) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [workflowsData, selectedFilter, searchQuery]);

    const handleEditWorkflow = (workflow: WorkflowData) => {
        openWorkflowEditSidebar(workflow);
    };

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
                    <CreateTemplateWorkflowDialog />
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
                    {workflows.map((workflow: WorkflowData) => (
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
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <p className="text-primary-300 text-sm line-clamp-1 leading-relaxed">
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

export function TemplateWorkflowGridView({ selectedFilter, onFilterChange, searchQuery, onSearchChange }: TemplateWorkflowGridViewProps) {
    const { user, isAuthenticated } = useAuth();

    // Fetch template workflows
    const { data: templateWorkflowsData, isLoading, error } = useQuery(
        chatQueries.templateWorkflowsOptions({ limit: 20 })
    );

    // Filter and search template workflows
    const templateWorkflows = useMemo(() => {
        const templates = templateWorkflowsData?.data || [];

        // Apply search filter first
        let searchFilteredTemplates = templates;
        if (searchQuery && searchQuery.length >= 2) {
            const query = searchQuery.toLowerCase();
            searchFilteredTemplates = templates.filter((template: TemplateWorkflowData) =>
                template.title.toLowerCase().includes(query) ||
                template.description.toLowerCase().includes(query) ||
                template.workflow.some((step: any) =>
                    step.name.toLowerCase().includes(query) ||
                    step.prompt.toLowerCase().includes(query)
                )
            );
        }

        // Apply filter
        let filteredTemplates = searchFilteredTemplates;
        switch (selectedFilter) {
            case "public":
                filteredTemplates = searchFilteredTemplates.filter((t: TemplateWorkflowData) => t.isPublic);
                break;
            case "private":
                filteredTemplates = searchFilteredTemplates.filter((t: TemplateWorkflowData) => !t.isPublic);
                break;
            case "all":
            default:
                filteredTemplates = searchFilteredTemplates;
        }

        // Sort by creation date (newest first)
        return filteredTemplates.sort((a: TemplateWorkflowData, b: TemplateWorkflowData) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [templateWorkflowsData, selectedFilter, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-primary-600">Loading templates...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-600">Failed to load templates. Please try again.</p>
            </div>
        );
    }

    if (templateWorkflows.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-primary-400">No templates found. Create your first template!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                        Templates
                    </span>
                    {(isLoading || error) && (
                        <div className="flex items-center gap-1">
                            {isLoading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />}
                        </div>
                    )}
                </div>

                <div className="flex w-full items-start md:items-center justify-end gap-3">
                    <CreateTemplateWorkflowDialog />
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
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
                    {templateWorkflows.map((template: TemplateWorkflowData) => (
                        <div
                            key={template.id}
                            className="relative group h-fit min-h-52 rounded-xl border border-primary-100 p-6  hover:border-primary-200 block cursor-pointer hover:bg-[#FAFAFA]"
                            style={{ zIndex: 1 }}
                            aria-label={`Go to ${template.title}`}
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
                                to={`/template/${template.id}`}
                                className="absolute inset-0 z-10"
                                aria-label={`Go to ${template.title}`}
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
                                                src={template.imageUrl ?? undefined}
                                                alt={template.title}
                                                className="rounded-[6px] bg-transparent"
                                            />
                                            <AvatarFallback className="rounded-[6px]">
                                                {template.title.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <h4 className="font-medium text-primary-800 capitalize flex items-center gap-2">
                                                {template.title}
                                                {template.isPublic ? (
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
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <p className="text-primary-300 text-sm line-clamp-1 leading-relaxed">
                                        {template.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-primary-400">
                                        <span>{template.workflow.length} steps</span>
                                        <span>•</span>
                                        <span>Template</span>
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