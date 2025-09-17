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

    // Add debugging
    useEffect(() => {
        console.log('🔍 Workflow Execution Debug:', {
            selectedWorkflowExecution,
            isRunningExecution,
            isCompletedExecution,
            executionId: selectedWorkflowExecution?.id,
            status: selectedWorkflowExecution?.status,
            hasResults: !!selectedWorkflowExecution?.results,
            resultsLength: selectedWorkflowExecution?.results?.length || 0
        });
    }, [selectedWorkflowExecution, isRunningExecution, isCompletedExecution]);

    // Only connect to stream for running executions
    const executionId = isRunningExecution ? (selectedWorkflowExecution?.id || null) : null;

    console.log('🎯 Stream Connection Decision:', {
        executionId,
        willConnect: !!executionId,
        reason: isRunningExecution ? 'is running' : 'not running or completed'
    });

    const workflowStream = useWorkflowStream(executionId);

    // Debug stream state
    useEffect(() => {
        console.log('📡 Stream State Update:', {
            isConnected: workflowStream.isConnected,
            status: workflowStream.status,
            error: workflowStream.error,
            eventsCount: workflowStream.events.length,
            hasCurrentStep: !!workflowStream.currentStep,
            currentStepResults: workflowStream.currentStep?.results?.length || 0
        });
    }, [workflowStream]);

    useEffect(() => {
        if (selectedWorkflowExecution && (workflowStream.status === 'completed' || workflowStream.status === 'failed')) {
            const updatedExecution = {
                ...selectedWorkflowExecution,
                status: workflowStream.status === 'completed' ? 'success' : 'failed',
                updatedAt: new Date().toISOString()
            } as any;
            updateSelectedWorkflowExecution(updatedExecution);
        }
    }, [workflowStream.status, selectedWorkflowExecution, updateSelectedWorkflowExecution]);

    const { data: executionDetails, isLoading: isLoadingDetails } = useQuery({
        ...chatQueries.workflowExecutionOptions(selectedWorkflowExecution?.id || ''),
        enabled: Boolean(isCompletedExecution && selectedWorkflowExecution?.id)
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

    // Get the current workflow status for display
    const getCurrentWorkflowStatus = () => {
        if (isRunningExecution) {
            if (workflowStream.isConnected && workflowStream.status === 'connected') {
                return 'running';
            } else if (workflowStream.status === 'connecting') {
                return 'connecting';
            } else if (selectedWorkflowExecution.status === 'queued') {
                return 'queued';
            } else {
                return 'pending';
            }
        } else if (isCompletedExecution) {
            return selectedWorkflowExecution.status || 'completed';
        } else {
            return selectedWorkflowExecution.status || 'unknown';
        }
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

                {/* Connection error for running executions */}
                {isRunningExecution && workflowStream.error && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-red-600">Connection Error</h3>
                        <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                            <p className="text-sm text-red-800">{workflowStream.error}</p>
                        </div>
                        <Button onClick={workflowStream.retry} variant="outline" size="sm">
                            Retry Connection
                        </Button>
                    </div>
                )}

                {/* Recent events for running executions with many events */}
                {isRunningExecution && workflowStream.events.length > 5 && (
                    <div className="space-y-4">
                        <Task defaultOpen={false}>
                            <TaskTrigger title={`Events (${workflowStream.events.length})`} />
                            <TaskContent>
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {workflowStream.events.slice(-10).map((event, index) => (
                                        <div key={index} className="text-xs p-2 border rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                                    {event.type}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {event.data && (
                                                <div className="mt-1 text-gray-600">
                                                    {JSON.stringify(event.data, null, 2).substring(0, 100)}...
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </TaskContent>
                        </Task>
                    </div>
                )}

                {/* Workflow Steps - Running execution with streaming data */}
                {isRunningExecution && workflowStream.currentStep?.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Workflow Progress</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {workflowStream.currentStep.results.map((step: any, index: number) => (
                                <WorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Show initial step data for running execution without stream data */}
                {isRunningExecution && !workflowStream.currentStep?.results && selectedWorkflowExecution.results && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Workflow Steps</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {selectedWorkflowExecution.results.map((step: any, index: number) => (
                                <WorkflowStep key={step.stepId || index} step={step} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Step Details - Running Execution without specific results */}
                {isRunningExecution && !workflowStream.currentStep && !selectedWorkflowExecution.results && (
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
                                        {workflowStream.isConnected ? (
                                            <div className="text-xs text-green-600 bg-green-50 rounded p-2">
                                                Connected to live updates
                                            </div>
                                        ) : (
                                            <div className="text-xs text-yellow-600 bg-yellow-50 rounded p-2">
                                                {workflowStream.status === 'connecting' ? 'Connecting...' : 'Disconnected from live updates'}
                                            </div>
                                        )}
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
                    {isRunningExecution && !workflowStream.isConnected && !workflowStream.error && (
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