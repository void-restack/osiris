import { X, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { useWorkflowStream } from "@/hooks/use-workflow-stream";
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
        case 'running':
        case 'pending':
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
    const variant = {
        'completed': 'default',
        'success': 'default',
        'failed': 'destructive',
        'error': 'destructive',
        'running': 'secondary',
        'pending': 'outline',
        'queued': 'outline',
        'yet-to-be-executed': 'secondary'
    }[status] || 'outline';

    return (
        <Badge variant={variant as any} className="capitalize">
            <StatusIcon status={status} />
            <span className="ml-1">{status}</span>
        </Badge>
    );
};

const WorkflowStep = ({ step, index }: { step: any; index: number }) => {
    const getTaskStatus = (status: string): 'pending' | 'in_progress' | 'completed' => {
        switch (status) {
            case 'running':
                return 'in_progress';
            case 'completed':
            case 'success':
                return 'completed';
            default:
                return 'pending';
        }
    };

    // Map API data structure to expected format
    const stepTitle = step.name || `Step ${step.stepId || index + 1}`;
    const stepStatus = step.status || 'pending';
    const toolCalls = step.toolCalls || step.tools || [];
    const stepOutput = step.result || step.output;

    return (
        <Task defaultOpen={stepStatus === 'running'} className="mb-4">
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
                    <Tool key={toolIndex} defaultOpen={false}>
                        <ToolHeader type={tool.name || 'Tool'} state="output-available" />
                        <ToolContent>
                            {tool.args && <ToolInput input={tool.args} />}
                            <div className="p-4">
                                <div className="text-xs text-muted-foreground mb-2">
                                    Executed at: {new Date(tool.timestamp).toLocaleString()}
                                </div>
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
                {step.error && (
                    <TaskItem>
                        <div className="mt-2">
                            <h5 className="text-xs font-medium text-destructive uppercase tracking-wide mb-2">
                                Error
                            </h5>
                            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                                <p className="text-sm text-destructive">{step.error}</p>
                            </div>
                        </div>
                    </TaskItem>
                )}

                {/* Show timing information */}
                {(step.startedAt || step.completedAt) && (
                    <TaskItem>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {step.startedAt && (
                                <div>Started: {new Date(step.startedAt).toLocaleTimeString()}</div>
                            )}
                            {step.completedAt && (
                                <div>Completed: {new Date(step.completedAt).toLocaleTimeString()}</div>
                            )}
                            {step.startedAt && step.completedAt && (
                                <div>Duration: {Math.round((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)}s</div>
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
            <TaskTrigger title={`Step ${step.stepId}: Completed`} />
            <TaskContent>
                <TaskItem>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <StatusBadge status={step.status || 'completed'} />
                    </div>
                </TaskItem>

                {/* Show tool executions if any */}
                {step.toolCalls && step.toolCalls.map((tool: any, toolIndex: number) => (
                    <Tool key={toolIndex} defaultOpen={false}>
                        <ToolHeader type={tool.name || 'Tool'} state="output-available" />
                        <ToolContent>
                            {tool.args && <ToolInput input={tool.args} />}
                            <div className="p-4">
                                <div className="text-xs text-muted-foreground mb-2">
                                    Executed at: {new Date(tool.timestamp).toLocaleString()}
                                </div>
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

    const isRunningExecution = selectedWorkflowExecution?.status === 'running' ||
        selectedWorkflowExecution?.status === 'pending' ||
        (selectedWorkflowExecution?.status as any) === 'queued';

    const executionId = isRunningExecution ? (selectedWorkflowExecution?.executionId || selectedWorkflowExecution?.id || null) : null;
    const workflowStream = useWorkflowStream(executionId);

    useEffect(() => {
        if (selectedWorkflowExecution && (workflowStream.status === 'completed' || workflowStream.status === 'failed')) {
            const updatedExecution = {
                ...selectedWorkflowExecution,
                status: workflowStream.status === 'completed' ? 'completed' : 'failed',
                completedAt: new Date().toISOString()
            } as any;
            updateSelectedWorkflowExecution(updatedExecution);
        }
    }, [workflowStream.status, selectedWorkflowExecution, updateSelectedWorkflowExecution]);

    const { data: executionDetails, isLoading: isLoadingDetails } = useQuery({
        ...chatQueries.workflowExecutionOptions(selectedWorkflowExecution?.executionId || ''),
        enabled: !isRunningExecution && !!selectedWorkflowExecution?.executionId
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

    return (
        <div className="relative h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-gray-900">Workflow Execution</h2>
                    <p className="text-sm text-gray-500">{selectedWorkflowExecution.workflowTitle}</p>
                    <p className="text-xs text-gray-400">
                        {selectedWorkflowExecution.startedAt
                            ? `Started ${formatRelativeTime(selectedWorkflowExecution.startedAt)}`
                            : 'Starting soon...'
                        }
                    </p>
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
                {!isRunningExecution && isLoadingDetails && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Loading Execution Details...</h3>
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                        </div>
                    </div>
                )}

                {isRunningExecution && workflowStream.events.length > 5 && (
                    <div className="space-y-4">
                        <Task defaultOpen={false}>
                            <TaskTrigger title={`Events (${workflowStream.events.length})`} />
                            <TaskContent>
                                <div className="space-y-1 overflow-y-auto">
                                    {workflowStream.events.slice(-5).map((event, index) => (
                                        <div key={index} className="text-xs p-2 border rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                                    {event.type}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TaskContent>
                        </Task>
                    </div>
                )}
                {/* Execution Status */}
                {/* <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Status</h3>
                        <StatusBadge status={isRunningExecution ? (workflowStream.status === 'connected' && selectedWorkflowExecution.status === 'queued' ? 'queued' : workflowStream.status) : selectedWorkflowExecution.status} />
                    </div>

                    {isRunningExecution && workflowStream.progress !== undefined && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{workflowStream.progress}%</span>
                            </div>
                            <Progress value={workflowStream.progress} className="w-full" />
                        </div>
                    )}

                    {isRunningExecution && workflowStream.error && (
                        <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                            <p className="text-sm text-red-800">{workflowStream.error}</p>
                        </div>
                    )}
                </div> */}

                {/* <Separator /> */}

                {/* Connection Status - Only show for running executions */}
                {/* {isRunningExecution && (
                    <>
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-900">Connection</h3>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${workflowStream.isConnected ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                <span className="text-xs text-gray-600">
                                    {workflowStream.isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                                {!workflowStream.isConnected && workflowStream.reconnectAttempts > 0 && (
                                    <span className="text-xs text-gray-500">
                                        (Retrying... {workflowStream.reconnectAttempts}/5)
                                    </span>
                                )}
                            </div>
                        </div>
                        <Separator />
                    </>
                )} */}

                {/* Workflow Steps - Running Execution */}
                {isRunningExecution && workflowStream.currentStep?.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Workflow Progress</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {workflowStream.currentStep.results.map((step: any, index: number) => (
                                <WorkflowStep key={step.id || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Step Details - Running Execution */}
                {isRunningExecution && workflowStream.currentStep && !workflowStream.currentStep.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Current Step</h3>
                        <Task defaultOpen={true}>
                            <TaskTrigger title="Workflow Execution in Progress" />
                            <TaskContent>
                                <TaskItem>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                            <span className="text-sm">Processing workflow...</span>
                                        </div>
                                        {workflowStream.currentStep.message && (
                                            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                                {workflowStream.currentStep.message}
                                            </div>
                                        )}
                                    </div>
                                </TaskItem>
                            </TaskContent>
                        </Task>
                    </div>
                )}

                {/* Completed Execution Steps - From API */}
                {!isRunningExecution && executionDetails?.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Completed Workflow</h3>
                        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {executionDetails.results.map((step: any, index: number) => (
                                <CompletedWorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex w-full gap-3 p-2 rounded-b-lg border-t border-t-primary-100 items-center justify-center absolute bottom-0 left-0 right-0">
                    {isRunningExecution && workflowStream.status === 'error' && (
                        <Button
                            onClick={workflowStream.retry}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                        >
                            <Loader2 className="h-4 w-4 mr-2" />
                            Retry Connection
                        </Button>
                    )}
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
