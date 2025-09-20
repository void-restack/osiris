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
        conversationId: localStorage.getItem('main_chat_conversation_id'),
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const getAuthHeaders = () => {
        const token =
            localStorage.getItem("access_token") ??
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzODlmYzFkOS0yMTdjLTRmZmQtYTM3Ny0wNjQ2NjlmZjZhMDkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgzMzMwOTEsImV4cCI6MTc1ODQxOTQ5MX0.yDd6GPrVYjiFVViPkxlNfk_oUDoE9AFiSnn-2w6rMCg";
        return {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${token}`,
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
            const requestBody = {
                ...data,
                ...(state.conversationId && { conversationId: state.conversationId }),
            };

            await fetchEventSource(`${API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestBody),
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
                    console.log('Received SSE event:', event.data);
                    try {
                        const eventData = JSON.parse(event.data);
                        console.log('Parsed event data:', eventData);

                        switch (eventData.type) {
                            case 'session-created':
                                console.log('Session created event received:', eventData);
                                const newConversationId = eventData.content;
                                console.log('Setting conversation ID:', newConversationId);
                                localStorage.setItem('main_chat_conversation_id', newConversationId);
                                console.log('Stored in localStorage:', localStorage.getItem('main_chat_conversation_id'));
                                setState(prev => ({
                                    ...prev,
                                    conversationId: newConversationId,
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

    const startNewConversation = useCallback(() => {
        localStorage.removeItem('main_chat_conversation_id');
        setState(prev => ({
            ...prev,
            messages: [],
            currentMessage: null,
            conversationId: null,
            error: null,
        }));
    }, []);

    return {
        ...state,
        sendMessage,
        stopStreaming,
        clearMessages,
        startNewConversation,
    };
};