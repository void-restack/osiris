import { useState, useCallback, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const API_BASE_URL = 'https://api.osirislabs.xyz/v1';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: Array<{
        id: string;
        name: string;
        args: any;
        result?: any;
    }>;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
}

interface ChatStreamState {
    messages: ChatMessage[];
    isStreaming: boolean;
    currentMessage: Partial<ChatMessage> | null;
    conversationId: string | null;
    error: string | null;
}

export const useChatStream = () => {
    const [state, setState] = useState<ChatStreamState>({
        messages: [],
        isStreaming: false,
        currentMessage: null,
        conversationId: null,
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    };

    const sendMessage = useCallback(async (data: {
        conversationId?: string;
        message: string;
        participants?: {
            participants: Array<{
                name: string;
                agentId?: string;
                knowledgeBaseId?: string;
            }>;
        };
        parentMessage?: string;
    }) => {
        setState(prev => ({
            ...prev,
            isStreaming: true,
            error: null,
            currentMessage: null
        }));

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: data.message,
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
        }));

        abortControllerRef.current = new AbortController();

        try {
            await fetchEventSource(`${API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
                signal: abortControllerRef.current.signal,
                async onopen(response) {
                    if (response.ok) {
                        console.log('Chat stream connected to:', `${API_BASE_URL}/chat/stream`);
                        return;
                    }

                    if (response.status === 401) {
                        throw new Error('Authentication required. Please log in again.');
                    }

                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                },
                onmessage(event) {
                    try {
                        const eventData = JSON.parse(event.data);

                        switch (eventData.type) {
                            case 'session-created':
                                setState(prev => ({
                                    ...prev,
                                    conversationId: eventData.content,
                                }));
                                break;

                            case 'message-start':
                                setState(prev => ({
                                    ...prev,
                                    currentMessage: {
                                        id: eventData.id,
                                        role: eventData.role,
                                        content: '',
                                        toolCalls: [],
                                    },
                                }));
                                break;

                            case 'text-delta':
                                setState(prev => ({
                                    ...prev,
                                    currentMessage: prev.currentMessage ? {
                                        ...prev.currentMessage,
                                        content: (prev.currentMessage.content || '') + eventData.textDelta,
                                    } : null,
                                }));
                                break;

                            case 'tool-call':
                                setState(prev => ({
                                    ...prev,
                                    currentMessage: prev.currentMessage ? {
                                        ...prev.currentMessage,
                                        toolCalls: [
                                            ...(prev.currentMessage.toolCalls || []),
                                            {
                                                id: eventData.toolCallId,
                                                name: eventData.toolName,
                                                args: eventData.args,
                                            },
                                        ],
                                    } : null,
                                }));
                                break;

                            case 'tool-result':
                                setState(prev => ({
                                    ...prev,
                                    currentMessage: prev.currentMessage ? {
                                        ...prev.currentMessage,
                                        toolCalls: prev.currentMessage.toolCalls?.map(call =>
                                            call.id === eventData.toolCallId
                                                ? { ...call, result: eventData.result }
                                                : call
                                        ),
                                    } : null,
                                }));
                                break;

                            case 'message-stop':
                                setState(prev => {
                                    const finalMessage: ChatMessage = {
                                        ...prev.currentMessage!,
                                        usage: eventData.usage,
                                    } as ChatMessage;

                                    return {
                                        ...prev,
                                        messages: [...prev.messages, finalMessage],
                                        currentMessage: null,
                                        isStreaming: false,
                                    };
                                });
                                break;

                            case 'error':
                                setState(prev => ({
                                    ...prev,
                                    error: eventData.error,
                                    isStreaming: false,
                                    currentMessage: null,
                                }));
                                break;
                        }
                    } catch (err) {
                        console.error('Failed to parse chat SSE message:', err);
                    }
                },
                onclose() {
                    console.log('Chat stream closed');
                    setState(prev => ({
                        ...prev,
                        isStreaming: false
                    }));
                },
                onerror(err) {
                    console.error('Chat stream error:', err);
                    setState(prev => ({
                        ...prev,
                        error: err.message || 'Stream connection failed',
                        isStreaming: false,
                        currentMessage: null,
                    }));
                    throw err;
                },
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message,
                isStreaming: false,
                currentMessage: null,
            }));
        }
    }, []);

    const stopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setState(prev => ({
            ...prev,
            isStreaming: false,
            currentMessage: null
        }));
    }, []);

    const clearMessages = useCallback(() => {
        setState(prev => ({
            ...prev,
            messages: [],
            currentMessage: null,
            error: null,
        }));
    }, []);

    return {
        ...state,
        sendMessage,
        stopStreaming,
        clearMessages,
    };
};