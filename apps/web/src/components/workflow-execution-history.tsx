import { useQuery } from "@tanstack/react-query";
import { chatQueries } from "@/lib/queries";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Loader2, Play, MoreVertical } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { WorkflowExecutionData } from "@/lib/store";
import { Icon } from "./ui/icon";
import { formatRelative } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

interface WorkflowExecutionHistoryProps {
    workflowId: string;
    workflowTitle: string;
    currentExecution?: WorkflowExecutionData | null;
}

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        case 'failed':
            return <XCircle className="h-4 w-4 text-red-600" />;
        case 'running':
            return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
        case 'pending':
            return <Clock className="h-4 w-4 text-yellow-600" />;
        default:
            return <Clock className="h-4 w-4 text-gray-500" />;
    }
};

const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
        'completed': { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
        'failed': { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
        'running': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
        'pending': { variant: 'outline', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' }
    }[status] || { variant: 'outline', className: '' };

    return (
        <Badge variant={variants.variant as any} className={variants.className}>
            <StatusIcon status={status} />
            <span className="ml-1 capitalize">{status}</span>
        </Badge>
    );
};

const ExecutionCard = ({
    execution,
    isCurrentExecution = false,
    onViewExecution
}: {
    execution: any;
    isCurrentExecution?: boolean;
    onViewExecution: (execution: any) => void;
}) => {
    const startDateStr = execution.createdAt;
    const completedDateStr = execution.updatedAt;
    const executionId = execution.id;

    console.log("Execution", execution)

    const startedAt = startDateStr ? new Date(startDateStr) : null;
    const completedAt = completedDateStr ? new Date(completedDateStr) : null;
    const duration = (startedAt && completedAt) ? completedAt.getTime() - startedAt.getTime() : null;

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${Math.round(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
        return `${Math.round(ms / 3600000)}h`;
    };

    return (
        <div className="w-full border-b last:border-b-0">
            <Button type="button" variant="ghost" onClick={() => onViewExecution(execution)} className="w-full rounded-none cursor-pointer flex items-center justify-between gap-4 h-16 px-4">
                <div className="flex w-full items-center">
                    {(isCurrentExecution && execution.status === 'running') ? <Loader2 className="animate-spin" /> : execution.error ?
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="underline underline-offset-2 font-medium">{executionId.slice(0, 8)}...{executionId.slice(-8)}</span>
                        </div>
                        :
                        <div className="flex items-center gap-2">
                            <Icon name="check" className="text-green-500" />
                            <span className="underline underline-offset-2 font-medium">{executionId.slice(0, 8)}...{executionId.slice(-8)}</span>
                        </div>
                    }

                    <span className="mx-2 text-primary-300 text-xs">Executed in</span>

                    <span className="text-primary-400 text-xs">{formatDuration(duration || 0)}</span>
                </div>
                <div className="flex w-full place-content-end text-sm font-normal text-primary-400">
                    {completedAt ? <span>{formatRelative(completedAt, new Date())}</span> : null}
                </div>
            </Button>
        </div>
    );
};

export function WorkflowExecutionHistory({
    workflowId,
    workflowTitle,
    currentExecution
}: WorkflowExecutionHistoryProps) {
    const { openWorkflowExecutionSidebar } = useAppStore();

    const { data: executions, isLoading, error } = useQuery(
        chatQueries.workflowExecutionsOptions(workflowId)
    );

    const handleViewExecution = (execution: any) => {
        const executionData: WorkflowExecutionData = {
            id: execution.id,
            flowId: execution.flowId,
            workflowTitle: workflowTitle,
            status: getExecutionStatus(execution),
            createdAt: execution.createdAt,
            updatedAt: execution.updatedAt,
        };
        openWorkflowExecutionSidebar(executionData);
    };

    const getExecutionStatus = (execution: any): "yet-to-be-executed" | "pending" | "success" | "failed" | "queued" => {
        const results = execution.results || [];
        const allCompleted = results.every((step: any) =>
            step.status === 'success' || step.status === 'failed'
        );

        if (allCompleted) {
            const hasFailures = results.some((step: any) => step.status === 'failed');
            return hasFailures ? 'failed' : 'success';
        }

        const hasPending = results.some((step: any) => step.status === 'pending');
        if (hasPending) return 'pending';

        return 'yet-to-be-executed';
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-2 text-primary-600">Loading execution history...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-600">Failed to load execution history. Please try again.</p>
                </div>
            </div>
        );
    }

    const executionsList = executions || [];
    const allExecutions = currentExecution
        ? [currentExecution, ...executionsList.filter((exec: any) => exec.id !== currentExecution.id)]
        : executionsList;

    const sortedExecutions = allExecutions.sort((a: any, b: any) => {
        const dateA = a.startedAt || a.createdAt;
        const dateB = b.startedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return (
        <div className="space-y-4 w-full">

            {sortedExecutions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Clock className="h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No executions yet</h4>
                    <p className="text-gray-500 text-center max-w-sm">
                        This workflow hasn't been executed yet. Click "Start now" to run your first execution.
                    </p>
                </div>
            ) : (
                <div className="h-fit max-h-[calc(100vh-480px)] w-full overflow-y-auto hidebar border rounded-lg">
                    <div className="w-full">
                        {sortedExecutions.map((execution: any, index: number) => {
                            const executionId = execution.id;
                            const currentExecutionId = currentExecution?.id;
                            return (
                                <>
                                    <ExecutionCard
                                        key={executionId}
                                        execution={execution}
                                        isCurrentExecution={currentExecutionId === executionId}
                                        onViewExecution={handleViewExecution}
                                    />
                                    <div className={cn("h-14 border-b px-3 relative", (index === sortedExecutions.length - 1) ? "hidden border-b-0" : "")}>
                                        <div className="absolute inset-y-0 shrink-0 h-12 left-6 w-1 border-l border-dashed border-l-dashed border-l-primary-200" />
                                        <div className="size-6 rounded-full border border-primary-100 -translate-y-1/2 bg-white" />
                                        <div className="size-6 rounded-full border border-primary-100 translate-y-4/5 bg-white" />
                                    </div>
                                </>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
