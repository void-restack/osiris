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
    // Handle both API response format and our internal format
    const startDateStr = execution.startedAt || execution.createdAt;
    const completedDateStr = execution.completedAt || execution.updatedAt;
    const executionId = execution.executionId || execution.id;

    // Safely parse dates
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
        <div className="h-20 w-full rounded-lg">
            <button type="button" onClick={() => onViewExecution(execution)} className="w-full cursor-pointer flex bg-primary-50 items-center justify-between gap-4 rounded-lg h-20 px-4">
                <div className="flex w-full">
                    {(isCurrentExecution || execution.status === 'running') ? <Loader2 className="animate-spin" /> : execution.error ?
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Error</span>
                        </div>
                        :
                        <div className="flex items-center gap-2">
                            <Icon name="check" className="text-green-500" />
                            <span>Completed</span>
                        </div>
                    }
                </div>

                <div className="flex w-full place-content-end">
                    {completedAt ? <span>{completedAt.toLocaleString()}</span> : null}
                </div>
            </button>
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
            executionId: execution.executionId || execution.id,
            workflowId: execution.workflowId || execution.flowId || workflowId,
            workflowTitle: workflowTitle,
            status: execution.status || 'completed', // Default to completed for API executions
            startedAt: execution.startedAt || execution.createdAt,
            completedAt: execution.completedAt || execution.updatedAt,
        };
        openWorkflowExecutionSidebar(executionData);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {/* <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Execution History</h3>
                </div> */}
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
                {/* <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Execution History</h3>
                </div> */}
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-600">Failed to load execution history. Please try again.</p>
                </div>
            </div>
        );
    }

    const allExecutions = currentExecution ? [currentExecution, ...(executions || [])] : executions || [];
    const sortedExecutions = allExecutions.sort((a: any, b: any) => {
        const dateA = a.startedAt || a.createdAt;
        const dateB = b.startedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return (
        <div className="space-y-4 w-full">
            {/* <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Execution History</h3>
                <div className="text-sm text-gray-500">
                    {sortedExecutions.length} execution{sortedExecutions.length !== 1 ? 's' : ''}
                </div>
            </div> */}

            {sortedExecutions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Clock className="h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No executions yet</h4>
                    <p className="text-gray-500 text-center max-w-sm">
                        This workflow hasn't been executed yet. Click "Start now" to run your first execution.
                    </p>
                </div>
            ) : (
                <ScrollArea className="h-[calc(100vh-480px)] w-full">
                    <div className="space-y-4 w-full">
                        {sortedExecutions.map((execution: any) => {
                            const executionId = execution.executionId || execution.id;
                            const currentExecutionId = currentExecution?.executionId || currentExecution?.id;
                            return (
                                <ExecutionCard
                                    key={executionId}
                                    execution={execution}
                                    isCurrentExecution={currentExecutionId === executionId}
                                    onViewExecution={handleViewExecution}
                                />
                            );
                        })}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
