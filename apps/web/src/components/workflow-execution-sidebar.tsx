import { X, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { chatQueries } from "@/lib/queries";
import {
    Task,
    TaskContent,
    TaskItem,
    TaskTrigger
} from "@/components/ai-elements/task";
import {
    Tool,
    ToolContent,
    ToolHeader,
    ToolInput,
} from "@/components/ai-elements/tool";
import { Response } from "@/components/ai-elements/response";

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed':
        case 'success':
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        case 'failed':
        case 'error':
            return <XCircle className="h-4 w-4 text-red-600" />;
        case 'pending': // Backend uses 'pending' for running steps
        case 'running':
            return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
        case 'queued':
            return <Clock className="h-4 w-4 text-orange-500" />;
        case 'yet-to-be-executed':
            return <Clock className="h-4 w-4 text-gray-400" />;
        default:
            return <Clock className="h-4 w-4 text-gray-500" />;
    }
};

const StatusBadge = ({ status }: { status: string }) => {
    const getVariantAndLabel = (status: string) => {
        switch (status) {
            case 'completed':
            case 'success':
                return { variant: 'default', label: 'completed' };
            case 'failed':
            case 'error':
                return { variant: 'destructive', label: 'failed' };
            case 'pending':
                return { variant: 'secondary', label: 'running' };
            case 'queued':
                return { variant: 'outline', label: 'queued' };
            case 'yet-to-be-executed':
                return { variant: 'secondary', label: 'pending' };
            default:
                return { variant: 'outline', label: status || 'unknown' };
        }
    };

    const { variant, label } = getVariantAndLabel(status);

    return (
        <Badge variant={variant as any} className="capitalize">
            <StatusIcon status={status} />
            <span className="ml-1">{label}</span>
        </Badge>
    );
};

const WorkflowStep = ({ step, index }: { step: any; index: number }) => {
    const getTaskStatus = (status: string): 'pending' | 'in_progress' | 'completed' => {
        switch (status) {
            case 'pending': // Backend sends 'pending' for running steps
            case 'running':
                return 'in_progress';
            case 'completed':
            case 'success':
                return 'completed';
            case 'failed':
            case 'error':
                return 'completed'; // Show as completed even if failed
            default:
                return 'pending';
        }
    };

    // Map API data structure to expected format
    const stepTitle = step.name || step.stepName || `Step ${step.stepId || index + 1}`;
    const stepStatus = step.status || 'yet-to-be-executed';
    const toolCalls = step.toolCalls || step.tools || [];
    const stepOutput = step.result || step.output;

    return (
        <Task defaultOpen={stepStatus === 'pending' || stepStatus === 'running'} className="mb-4">
            <TaskTrigger title={stepTitle} />
            <TaskContent>
                <TaskItem>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <StatusBadge status={stepStatus} />
                    </div>
                </TaskItem>

                {/* Show tool executions if any */}
                {toolCalls && toolCalls.map((tool: any, toolIndex: number) => (
                    <Tool key={tool.id || toolIndex} defaultOpen={false}>
                        <ToolHeader type={tool.name || 'Tool'} state="output-available" />
                        <ToolContent>
                            {tool.args && <ToolInput input={tool.args} />}
                            <div className="p-4">
                                <div className="text-xs text-muted-foreground mb-2">
                                    Executed at: {new Date(tool.timestamp).toLocaleString()}
                                </div>
                                {tool.result && (
                                    <div className="mt-2">
                                        <h6 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                            Tool Result
                                        </h6>
                                        <div className="rounded-md border bg-muted/30 p-2 text-xs">
                                            {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ToolContent>
                    </Tool>
                ))}

                {/* Show step output/result */}
                {stepOutput && (
                    <TaskItem>
                        <div className="mt-2">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Result
                            </h5>
                            <div className="rounded-md border bg-muted/30 p-3">
                                {typeof stepOutput === 'string' ? (
                                    <Response>{stepOutput}</Response>
                                ) : (
                                    <pre className="text-xs whitespace-pre-wrap text-foreground">
                                        {JSON.stringify(stepOutput, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </TaskItem>
                )}

                {/* Show step error */}
                {(step.error || step.errorReason) && (
                    <TaskItem>
                        <div className="mt-2">
                            <h5 className="text-xs font-medium text-destructive uppercase tracking-wide mb-2">
                                Error
                            </h5>
                            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                                <p className="text-sm text-destructive">{step.error || step.errorReason}</p>
                            </div>
                        </div>
                    </TaskItem>
                )}

                {/* Show timing information */}
                {(step.createdAt || step.updatedAt) && (
                    <TaskItem>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {step.createdAt && (
                                <div>Started: {new Date(step.createdAt).toLocaleTimeString()}</div>
                            )}
                            {step.updatedAt && (
                                <div>Completed: {new Date(step.updatedAt).toLocaleTimeString()}</div>
                            )}
                            {step.createdAt && step.updatedAt && (
                                <div>Duration: {Math.round((new Date(step.updatedAt).getTime() - new Date(step.createdAt).getTime()) / 1000)}s</div>
                            )}
                        </div>
                    </TaskItem>
                )}
            </TaskContent>
        </Task>
    );
};

const CompletedWorkflowStep = ({ step, index }: { step: any; index: number }) => {
    return (
        <Task defaultOpen={index === 0} className="mb-4">
            <TaskTrigger title={`Step ${step.stepId}: ${step.stepName || 'Completed'}`} />
            <TaskContent>
                <TaskItem>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <StatusBadge status={step.status || 'completed'} />
                    </div>
                </TaskItem>

                {/* Show tool executions if any */}
                {step.toolCalls && step.toolCalls.map((tool: any, toolIndex: number) => (
                    <Tool key={tool.id || toolIndex} defaultOpen={false}>
                        <ToolHeader type={tool.name || 'Tool'} state="output-available" />
                        <ToolContent>
                            {tool.args && <ToolInput input={tool.args} />}
                            <div className="p-4">
                                <div className="text-xs text-muted-foreground mb-2">
                                    Executed at: {new Date(tool.timestamp).toLocaleString()}
                                </div>
                                {tool.result && (
                                    <div className="mt-2">
                                        <h6 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                            Tool Result
                                        </h6>
                                        <div className="rounded-md border bg-muted/30 p-2 text-xs">
                                            {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ToolContent>
                    </Tool>
                ))}

                {/* Show step result */}
                {step.result && (
                    <TaskItem>
                        <div className="mt-2">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Result
                            </h5>
                            <div className="rounded-md border bg-muted/30 p-3">
                                <Response>{step.result}</Response>
                            </div>
                        </div>
                    </TaskItem>
                )}

                {/* Show step error */}
                {(step.error || step.errorReason) && (
                    <TaskItem>
                        <div className="mt-2">
                            <h5 className="text-xs font-medium text-destructive uppercase tracking-wide mb-2">
                                Error
                            </h5>
                            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                                <p className="text-sm text-destructive">{step.error || step.errorReason}</p>
                            </div>
                        </div>
                    </TaskItem>
                )}
            </TaskContent>
        </Task>
    );
};

export function WorkflowExecutionSidebar() {
    const {
        selectedWorkflowExecution,
        closeWorkflowExecutionSidebar,
        isWorkflowExecutionSidebarOpen,
        updateSelectedWorkflowExecution,
    } = useAppStore();

    // Enhanced status checking - handle multiple possible status values
    const isRunningExecution = selectedWorkflowExecution && (
        selectedWorkflowExecution.status === 'pending' ||
        selectedWorkflowExecution.status === 'queued' ||
        selectedWorkflowExecution.status === 'running' ||
        // If no status is set, check if there are any incomplete steps
        (!selectedWorkflowExecution.status &&
            selectedWorkflowExecution.results &&
            selectedWorkflowExecution.results.some((step: any) =>
                step.status === 'yet-to-be-executed' || step.status === 'pending'
            ))
    );

    const isCompletedExecution = selectedWorkflowExecution && (
        selectedWorkflowExecution.status === 'success' ||
        selectedWorkflowExecution.status === 'failed' ||
        // If no status but all steps are complete
        (!selectedWorkflowExecution.status &&
            selectedWorkflowExecution.results &&
            selectedWorkflowExecution.results.every((step: any) =>
                step.status === 'success' || step.status === 'failed'
            ))
    );

    const { data: executionDetails, isLoading: isLoadingDetails } = useQuery({
        ...chatQueries.workflowExecutionOptions(selectedWorkflowExecution?.id || ''),
        enabled: Boolean(selectedWorkflowExecution?.id)
    });

    if (!isWorkflowExecutionSidebarOpen || !selectedWorkflowExecution) {
        return null;
    }

    const formatRelativeTime = (timestamp: string) => {
        const now = new Date().getTime();
        const past = new Date(timestamp).getTime();
        const diffMs = now - past;

        if (diffMs < 60000) return 'Just now';
        if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
        if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
        return `${Math.floor(diffMs / 86400000)}d ago`;
    };

    const computedStatusFromResults = (results?: any[]) => {
        if (!Array.isArray(results) || results.length === 0) return selectedWorkflowExecution.status || 'pending';
        const anyRunning = results.some((s: any) => s.status === 'pending' || s.status === 'running' || s.status === 'yet-to-be-executed');
        if (anyRunning) return 'pending';
        const anyFailed = results.some((s: any) => s.status === 'failed');
        return anyFailed ? 'failed' : 'success';
    };

    const getCurrentWorkflowStatus = () => {
        const statusFromQuery = computedStatusFromResults(executionDetails?.results);
        if (statusFromQuery) return statusFromQuery;
        return selectedWorkflowExecution.status || 'pending';
    };

    return (
        <div className="relative h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-gray-900">Workflow Execution</h2>
                    <p className="text-sm text-gray-500">{selectedWorkflowExecution.workflowTitle}</p>
                    <div className="mt-2">
                        <StatusBadge status={getCurrentWorkflowStatus()} />
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeWorkflowExecutionSidebar}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto h-full">
                {/* Loading state for completed executions */}
                {isCompletedExecution && isLoadingDetails && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Loading Execution Details...</h3>
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                        </div>
                    </div>
                )}

                {/* Connection error placeholder removed since streaming is disabled */}

                {/* Events section removed since streaming is disabled */}

                {/* Workflow Steps - show from polled execution details when running */}
                {isRunningExecution && executionDetails?.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Workflow Progress</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {executionDetails.results.map((step: any, index: number) => (
                                <WorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Show initial step data for running execution without polled data */}
                {isRunningExecution && !executionDetails?.results && selectedWorkflowExecution.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Workflow Steps</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {selectedWorkflowExecution.results.map((step: any, index: number) => (
                                <WorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Running state fallback */}
                {isRunningExecution && !executionDetails?.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Current Status</h3>
                        <Task defaultOpen={true}>
                            <TaskTrigger title="Workflow Execution in Progress" />
                            <TaskContent>
                                <TaskItem>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                            <span className="text-sm">Processing workflow...</span>
                                        </div>
                                    </div>
                                </TaskItem>
                            </TaskContent>
                        </Task>
                    </div>
                )}

                {/* Completed Execution Steps - Only show for completed executions */}
                {isCompletedExecution && executionDetails?.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Completed Workflow</h3>
                        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {executionDetails.results.map((step: any, index: number) => (
                                <CompletedWorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Show completed execution from selectedWorkflowExecution if no detailed data */}
                {isCompletedExecution && !executionDetails?.results && selectedWorkflowExecution.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Workflow Results</h3>
                        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {selectedWorkflowExecution.results.map((step: any, index: number) => (
                                <CompletedWorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex w-full gap-3 p-2 rounded-b-lg border-t border-t-primary-100 items-center justify-center absolute bottom-0 left-0 right-0">
                    {/* Retry removed since streaming is disabled */}
                    <Button
                        variant="outline"
                        onClick={closeWorkflowExecutionSidebar}
                        size="sm"
                        className="flex-1"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}