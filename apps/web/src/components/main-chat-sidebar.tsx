import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowLeft, MessageCircle, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatPromptInput } from "@/components/ui/chat-prompt-input";
import { InlineVoiceInput } from "@/components/ui/inline-voice-input";
import {
    PromptInput,
    PromptInputBody,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
    PromptInputActionMenu,
    PromptInputActionMenuTrigger,
    PromptInputActionMenuContent,
    PromptInputActionAddAttachments,
    PromptInputSubmit,
    PromptInputAttachments,
    PromptInputAttachment,
    type PromptInputMessage
} from "@/components/ai-elements/prompt-input";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from "@/components/ai-elements/conversation";
import {
    Message,
    MessageContent,
    MessageAvatar
} from "@/components/ai-elements/message";
type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

type HelpSection = 'main' | 'getting-started' | 'features' | 'troubleshooting' | 'api';

export function MainChatSidebar() {
    const [isHelpMode, setIsHelpMode] = useState(false);
    const [currentHelpSection, setCurrentHelpSection] = useState<HelpSection>('main');

    const location = useLocation();
    const { closeMainChatSidebar } = useAppStore();
    const isIndexPage = location.pathname === "/";

    // Use the chat stream hook
    const {
        messages,
        isStreaming,
        currentMessage,
        error,
        sendMessage,
        stopStreaming,
        clearMessages
    } = useChatStream();

    const toggleHelpMode = () => {
        setIsHelpMode(!isHelpMode);
        if (!isHelpMode) {
            setCurrentHelpSection('main');
        }
    };

    const goToMainChat = () => {
        setIsHelpMode(false);
        setCurrentHelpSection('main');
    };

    const goBack = () => {
        if (currentHelpSection === 'main') {
            setIsHelpMode(false);
        } else {
            setCurrentHelpSection('main');
        }
    };

    const handleChatSubmit = async (message: PromptInputMessage & { mentions?: any[] }) => {
        if (!message.text?.trim() && !message.files?.length) return;

        try {
            // Convert mentions to participants format expected by the API
            const participants = message.mentions?.map(mention => ({
                name: mention.name,
                ...(mention.type === 'package' ? { agentId: mention.id } : {}),
                ...(mention.type === 'knowledge-base' ? { knowledgeBaseId: mention.id } : {}),
            })) || [];

            await sendMessage({
                message: message.text || '',
                participants: participants.length > 0 ? { participants } : undefined,
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };


    const helpItems = [
        { id: 'getting-started', title: 'Getting Started', description: 'Learn the basics' },
        { id: 'features', title: 'Features', description: 'Explore available features' },
        { id: 'troubleshooting', title: 'Troubleshooting', description: 'Common issues and solutions' },
        { id: 'api', title: 'API Reference', description: 'Technical documentation' },
    ];

    const renderHelpContent = () => {
        switch (currentHelpSection) {
            case 'main':
                return (
                    <div className="space-y-3">
                        <h4 className="font-medium text-primary-800 mb-4">Help Topics</h4>
                        {helpItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentHelpSection(item.id as HelpSection)}
                                className="w-full text-left p-3 rounded-lg border border-primary-100 hover:bg-primary-50 transition-colors"
                            >
                                <div className="font-medium text-primary-800">{item.title}</div>
                                <div className="text-sm text-primary-400">{item.description}</div>
                            </button>
                        ))}
                    </div>
                );
            case 'getting-started':
                return (
                    <div>
                        <h4 className="font-medium text-primary-800 mb-4">Getting Started</h4>
                        <div className="space-y-3 text-sm text-primary-600">
                            <p>Welcome to Osiris! Here's how to get started:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Create your first connection</li>
                                <li>Set up MCP packages</li>
                                <li>Configure your workflows</li>
                                <li>Start chatting with AI</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'features':
                return (
                    <div>
                        <h4 className="font-medium text-primary-800 mb-4">Features</h4>
                        <div className="space-y-3 text-sm text-primary-600">
                            <p>Discover what you can do with Osiris:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>AI-powered chat interface</li>
                                <li>MCP package management</li>
                                <li>Workflow automation</li>
                                <li>Knowledge base integration</li>
                                <li>OAuth client management</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'troubleshooting':
                return (
                    <div>
                        <h4 className="font-medium text-primary-800 mb-4">Troubleshooting</h4>
                        <div className="space-y-3 text-sm text-primary-600">
                            <p>Common issues and solutions:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Connection issues</li>
                                <li>MCP package errors</li>
                                <li>Workflow failures</li>
                                <li>Authentication problems</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'api':
                return (
                    <div>
                        <h4 className="font-medium text-primary-800 mb-4">API Reference</h4>
                        <div className="space-y-3 text-sm text-primary-600">
                            <p>Technical documentation:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Authentication endpoints</li>
                                <li>MCP package APIs</li>
                                <li>Workflow management</li>
                                <li>Knowledge base APIs</li>
                            </ul>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-primary-100">
                <div className="flex items-center gap-2">
                    {isHelpMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goBack}
                            className="h-8 w-8 p-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <h3 className="text-lg font-medium">
                        {isHelpMode ? "Help" : "Chat"}
                    </h3>
                </div>
                <div className="flex items-center gap-1">
                    {isHelpMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToMainChat}
                            className="h-8 w-8 p-0"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleHelpMode}
                        className="h-8 w-8 p-0"
                    >
                        <HelpCircle className="h-4 w-4" />
                    </Button>
                    {!isIndexPage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={closeMainChatSidebar}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {isHelpMode ? (
                    <>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {renderHelpContent()}
                        </div>

                        <div className="border-t border-primary-100 p-4">
                            <PromptInput onSubmit={handleChatSubmit} accept="image/*" multiple>
                                <PromptInputBody>
                                    <PromptInputAttachments>
                                        {(attachment) => (
                                            <PromptInputAttachment data={attachment} />
                                        )}
                                    </PromptInputAttachments>
                                    <PromptInputTextarea placeholder="Ask a question..." />
                                    <PromptInputToolbar>
                                        <PromptInputTools>
                                            <PromptInputActionMenu>
                                                <PromptInputActionMenuTrigger />
                                                <PromptInputActionMenuContent>
                                                    <PromptInputActionAddAttachments />
                                                </PromptInputActionMenuContent>
                                            </PromptInputActionMenu>
                                            <InlineVoiceInput />
                                        </PromptInputTools>
                                        <PromptInputSubmit status={isStreaming ? "submitted" : undefined} />
                                    </PromptInputToolbar>
                                </PromptInputBody>
                            </PromptInput>
                        </div>
                    </>
                ) : (
                    <>
                        <Conversation className="flex-1">
                            <ConversationContent>
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-center">
                                        <div>
                                            <h4 className="text-lg font-medium text-primary-800 mb-2">Welcome to Osiris Chat</h4>
                                            <p className="text-sm text-primary-400">
                                                Start a conversation by typing a message below.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((message) => (
                                            <Message key={message.id} from={message.role as 'user' | 'assistant'}>
                                                <MessageAvatar
                                                    src={message.role === 'user' ? '/user-login.png' : '/logo.png'}
                                                    name={message.role === 'user' ? 'You' : 'Osiris'}
                                                />
                                                <MessageContent>
                                                    {message.content}
                                                    {message.toolCalls && message.toolCalls.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {message.toolCalls.map((toolCall) => (
                                                                <div key={toolCall.id} className="text-xs text-primary-400 bg-primary-50 p-2 rounded">
                                                                    <strong>{toolCall.name}</strong>
                                                                    {toolCall.result && (
                                                                        <div className="mt-1">
                                                                            Result: {JSON.stringify(toolCall.result)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </MessageContent>
                                            </Message>
                                        ))}
                                        {currentMessage && (
                                            <Message from="assistant">
                                                <MessageAvatar src="/logo.png" name="Osiris" />
                                                <MessageContent>
                                                    {currentMessage.content}
                                                    {currentMessage.toolCalls && currentMessage.toolCalls.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {currentMessage.toolCalls.map((toolCall) => (
                                                                <div key={toolCall.id} className="text-xs text-primary-400 bg-primary-50 p-2 rounded">
                                                                    <strong>{toolCall.name}</strong>
                                                                    {toolCall.result && (
                                                                        <div className="mt-1">
                                                                            Result: {JSON.stringify(toolCall.result)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {isStreaming && (
                                                        <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1"></span>
                                                    )}
                                                </MessageContent>
                                            </Message>
                                        )}
                                    </>
                                )}
                                {error && (
                                    <Message from="assistant">
                                        <MessageAvatar src="/logo.png" name="Osiris" />
                                        <MessageContent>
                                            <div className="text-red-600 bg-red-50 p-2 rounded">
                                                Error: {error}
                                            </div>
                                        </MessageContent>
                                    </Message>
                                )}
                            </ConversationContent>
                            <ConversationScrollButton />
                        </Conversation>

                        <div className="border-t border-primary-100 p-4">
                            <ChatPromptInput
                                onSubmit={handleChatSubmit}
                                isLoading={isStreaming}
                                placeholder="Type your message..."
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
