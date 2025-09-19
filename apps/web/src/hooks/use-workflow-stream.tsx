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
        const token = localStorage.getItem("access_token") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzODlmYzFkOS0yMTdjLTRmZmQtYTM3Ny0wNjQ2NjlmZjZhMDkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgwODIwMzcsImV4cCI6MTc1ODE2ODQzN30.p0jDIvJWIPz3Nir89xTqcuPVd8HRlcg8KQUWZMzBuIo";

        console.log('🔑 Getting auth token:', token ? 'Found' : 'Not found');

        if (!token) {
            throw new Error('No access token found. Please log in again.');
        }

        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
        };
    };

    const handleEvent = useCallback((type: string, data: any) => {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
        };

        console.log(`📨 Received SSE event: ${type}`, data);

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
                console.log('✅ Workflow stream connected successfully');
                break;

            case 'initial_status':
                setState(prev => ({
                    ...prev,
                    currentStep: data.status,
                    progress: calculateProgress(data.status),
                    status: 'connected'
                }));
                console.log('📊 Initial status received:', data.status);
                break;

            case 'workflow_started':
                setState(prev => ({
                    ...prev,
                    status: 'connected'
                }));
                console.log('🚀 Workflow started');
                break;

            case 'step_started':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            status: 'pending', // Backend sends 'pending' for running steps
                            stepName: data.stepName,
                            createdAt: data.timestamp
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        status: 'connected'
                    };
                });
                console.log(`🔄 Step ${data.stepIndex} started: ${data.stepName}`);
                break;

            case 'step_pending':
                // Handle both initial pending state and running state
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            status: data.status, // Use the status from the event
                            stepName: data.stepName
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        status: 'connected'
                    };
                });
                break;

            case 'step_progress':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            progress: data.progress
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        progress: data.progress
                    };
                });
                break;

            case 'step_completed':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            status: 'success', // Map to 'success' for completed steps
                            result: data.result,
                            toolCalls: data.toolCalls,
                            updatedAt: data.timestamp
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        progress: calculateProgress(updated)
                    };
                });
                console.log(`✅ Step ${data.stepIndex} completed`);
                break;

            case 'step_failed':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        updated.results[data.stepIndex] = {
                            ...updated.results[data.stepIndex],
                            status: 'failed',
                            errorReason: data.errorReason,
                            error: data.errorReason,
                            updatedAt: data.timestamp
                        };
                    }
                    return {
                        ...prev,
                        currentStep: updated,
                        progress: calculateProgress(updated)
                    };
                });
                console.log(`❌ Step ${data.stepIndex} failed: ${data.errorReason}`);
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
                console.log(`🔧 Tool call: ${data.toolName} (${data.toolCallId})`);
                break;

            case 'step_response':
                setState(prev => {
                    const updated = { ...prev.currentStep };
                    if (updated.results && data.stepIndex !== undefined) {
                        const step = updated.results[data.stepIndex];
                        if (step) {
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
                console.log('🏁 Workflow completed successfully');
                break;

            case 'workflow_failed':
                setState(prev => ({
                    ...prev,
                    status: 'failed',
                    error: data.errorReason || 'Workflow failed'
                }));
                console.log('💥 Workflow failed:', data.errorReason);
                break;

            case 'stream_end':
                console.log('🔚 Stream ended:', data.reason);
                disconnect();
                break;

            case 'heartbeat':
                // Keep connection alive - no state change needed
                break;

            default:
                console.warn(`⚠️ Unknown event type: ${type}`, data);
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
            console.log('🚫 Not connecting:', { executionId, isConnected: state.isConnected });
            return;
        }

        console.log('🔌 Connecting to workflow stream for execution:', executionId);

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
                    console.log('SSE Response status:', response.status);
                    console.log('SSE Response headers:', Object.fromEntries(response.headers.entries()));

                    if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
                        console.log('✅ Workflow stream connected successfully');
                        return;
                    }

                    // Detailed error handling
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please log in again.');
                    }

                    if (response.status === 403) {
                        throw new Error('Access denied. You may not have permission to view this workflow execution.');
                    }

                    if (response.status === 404) {
                        throw new Error('Workflow execution not found.');
                    }

                    if (response.status === 0) {
                        throw new Error('Network error: Unable to connect to the server. Check CORS configuration.');
                    }

                    // Try to get error details from response
                    const text = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText}. ${text}`);
                },

                onmessage(event) {
                    try {
                        const data = JSON.parse(event.data);
                        handleEvent(event.event || data.type, data);
                    } catch (err) {
                        console.error('Failed to parse SSE message:', err);
                        console.error('Raw event data:', event.data);
                    }
                },

                onclose() {
                    console.log('🔌 Workflow stream closed');
                    setState(prev => ({ ...prev, isConnected: false }));

                    // Only reconnect if we were connected and haven't reached max attempts
                    if (state.status === 'connected' &&
                        reconnectAttempts.current < maxReconnectAttempts) {
                        reconnectAttempts.current++;
                        const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);

                        console.log(`🔄 Reconnecting in ${delay}ms... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

                        reconnectTimeoutRef.current = setTimeout(() => {
                            connect();
                        }, delay);
                    }
                },

                onerror(err) {
                    console.error('❌ Workflow stream error:', err);
                    setState(prev => ({
                        ...prev,
                        error: err.message || 'Stream connection failed',
                        status: 'error',
                        isConnected: false
                    }));
                },
            });
        } catch (error: any) {
            console.error('❌ Failed to start workflow stream:', error);
            setState(prev => ({
                ...prev,
                error: error.message,
                status: 'error',
                isConnected: false
            }));
        }
    }, [executionId, state.isConnected, state.status, handleEvent]);

    const disconnect = useCallback(() => {
        console.log('🔌 Manually disconnecting workflow stream');

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
        console.log('🔄 Retrying workflow stream connection');
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
            console.log('🎯 Execution ID changed, connecting:', executionId);
            connect();
        }
        return () => {
            console.log('🧹 Cleaning up workflow stream connection');
            disconnect();
        };
    }, [executionId, connect, disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        retry,
        reconnectAttempts: reconnectAttempts.current,
    };
};