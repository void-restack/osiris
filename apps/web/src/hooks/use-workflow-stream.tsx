import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE_URL = 'https://api.osirislabs.xyz/v1';

interface WorkflowStreamState {
    isConnected: boolean;
    status: 'idle' | 'connecting' | 'connected' | 'completed' | 'failed' | 'error';
    events: Array<{
        type: string;
        data: any;
        timestamp: string;
    }>;
    error: string | null;
    currentStep?: any;
    progress?: number;
}

export const useWorkflowStream = (executionId: string | null) => {
    const [state, setState] = useState<WorkflowStreamState>({
        isConnected: false,
        status: 'idle',
        events: [],
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const getAuthHeaders = () => {
        // Use the access token from the workspace rules
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzODlmYzFkOS0yMTdjLTRmZmQtYTM3Ny0wNjQ2NjlmZjZhMDkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTcyNjQwMjcsImV4cCI6MTc1NzM1MDQyN30.3MDlkXzRSYXR9lanXthF18bVLz9AB-yL2_IjwqExZaA';
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
        };
    };

    const handleEvent = useCallback((type: string, data: any) => {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
        };

        setState(prev => ({
            ...prev,
            events: [...prev.events, event],
        }));

        switch (type) {
            case 'connection_established':
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    status: 'connected',
                    error: null
                }));
                reconnectAttempts.current = 0;
                break;

            case 'initial_status':
                setState(prev => ({
                    ...prev,
                    currentStep: data.status,
                    progress: calculateProgress(data.status),
                    status: 'connected'
                }));
                break;

            case 'step_started':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            status: 'running',
                            name: data.stepName
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        status: 'connected'
                    };
                });
                break;

            case 'step_completed':
            case 'step_failed':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            status: type === 'step_completed' ? 'success' : 'failed',
                            ...(data.result && { result: data.result }),
                            ...(data.error && { error: data.error })
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        progress: calculateProgress(updated)
                    };
                });
                break;

            case 'step_tool_call':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        const step = updated.results[data.stepIndex];
                        if (step) {
                            step.toolCalls = step.toolCalls || [];
                            const existingToolIndex = step.toolCalls.findIndex((t: any) => t.id === data.toolCallId);

                            const toolCall = {
                                id: data.toolCallId,
                                name: data.toolName,
                                args: data.toolArgs,
                                timestamp: data.timestamp,
                                ...(data.toolResult && { result: data.toolResult })
                            };

                            if (existingToolIndex >= 0) {
                                step.toolCalls[existingToolIndex] = { ...step.toolCalls[existingToolIndex], ...toolCall };
                            } else {
                                step.toolCalls.push(toolCall);
                            }
                        }
                    }
                    return { ...prev, currentStep: updated };
                });
                break;

            case 'step_response':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        const step = updated.results[data.stepIndex];
                        if (step) {
                            // Append streaming response
                            step.result = (step.result || '') + data.result;
                        }
                    }
                    return { ...prev, currentStep: updated };
                });
                break;

            case 'workflow_completed':
                setState(prev => ({
                    ...prev,
                    status: 'completed',
                    progress: 100
                }));
                break;

            case 'workflow_failed':
                setState(prev => ({
                    ...prev,
                    status: 'failed',
                    error: data.error || 'Workflow failed'
                }));
                break;

            case 'stream_end':
                disconnect();
                break;

            case 'heartbeat':
                // Keep connection alive
                break;
        }
    }, []);

    const calculateProgress = (status: any): number => {
        if (!status?.results) return 0;
        const completed = status.results.filter((r: any) =>
            r.status === 'success' || r.status === 'failed'
        ).length;
        return Math.round((completed / status.results.length) * 100);
    };

    const connect = useCallback(async () => {
        if (!executionId || state.isConnected) {
            return;
        }

        setState(prev => ({
            ...prev,
            status: 'connecting',
            error: null
        }));

        abortControllerRef.current = new AbortController();

        try {
            await fetchEventSource(`${API_BASE_URL}/chat/workflow/stream/${executionId}`, {
                method: 'GET',
                signal: abortControllerRef.current.signal,
                headers: getAuthHeaders(),
                async onopen(response) {
                    if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
                        console.log('Workflow stream connected to:', `${API_BASE_URL}/chat/workflow/stream/${executionId}`);
                        return;
                    }

                    // Handle authentication errors
                    if (response.status === 401) {
                        throw new Error('Authentication required. Please log in again.');
                    }

                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                },
                onmessage(event) {
                    try {
                        const data = JSON.parse(event.data);
                        handleEvent(event.event || data.type, data);
                    } catch (err) {
                        console.error('Failed to parse SSE message:', err);
                    }
                },
                onclose() {
                    console.log('Workflow stream closed');
                    setState(prev => ({ ...prev, isConnected: false }));

                    // Auto-reconnect logic
                    if (state.status === 'connected' && reconnectAttempts.current < maxReconnectAttempts) {
                        reconnectAttempts.current++;
                        reconnectTimeoutRef.current = setTimeout(() => {
                            console.log(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                            connect();
                        }, Math.pow(2, reconnectAttempts.current) * 1000);
                    }
                },
                onerror(err) {
                    console.error('Workflow stream error:', err);
                    setState(prev => ({
                        ...prev,
                        error: err.message || 'Stream connection failed',
                        status: 'error',
                        isConnected: false
                    }));
                    throw err;
                },
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message,
                status: 'error',
                isConnected: false
            }));
        }
    }, [executionId, state.isConnected, handleEvent]);

    const disconnect = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setState(prev => ({
            ...prev,
            isConnected: false,
            status: prev.status === 'completed' || prev.status === 'failed'
                ? prev.status
                : 'idle'
        }));
    }, []);

    const retry = useCallback(() => {
        reconnectAttempts.current = 0;
        setState(prev => ({
            ...prev,
            error: null,
            events: [],
            status: 'idle'
        }));
        connect();
    }, [connect]);

    useEffect(() => {
        if (executionId) {
            connect();
        }
        return () => disconnect();
    }, [executionId, connect, disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        retry,
        reconnectAttempts: reconnectAttempts.current,
    };
};