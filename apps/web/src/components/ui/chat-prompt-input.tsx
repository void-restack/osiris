import React, { useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandGroup, CommandItem, CommandList, CommandLoading, CommandEmpty } from "@/components/ui/command";
import { packageQueries, knowledgeQueries } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
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
import { InlineVoiceInput } from "@/components/ui/inline-voice-input";

interface MentionData {
    id: string;
    name: string;
    type: 'package' | 'knowledge-base';
    description?: string;
    iconUrl?: string;
}

interface ChatPromptInputProps {
    onSubmit: (message: PromptInputMessage) => void;
    isLoading?: boolean;
    placeholder?: string;
}

export function ChatPromptInput({ onSubmit, isLoading, placeholder = "Type your message..." }: ChatPromptInputProps) {
    const [triggerType, setTriggerType] = useState<'@' | '#' | null>(null);
    const [triggerQuery, setTriggerQuery] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [mentions, setMentions] = useState<Map<string, MentionData>>(new Map());
    const [textareaValue, setTextareaValue] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const commandInputRef = useRef<HTMLInputElement>(null);

    const popularPackagesQuery = useQuery({
        ...packageQueries.popularOptions(),
        enabled: triggerType === '@' && triggerQuery.length === 0,
    });

    const packagesQuery = useQuery({
        ...packageQueries.listOptions({
            search: triggerQuery,
            limit: 10,
            isLive: true,
        }),
        enabled: triggerType === '@' && triggerQuery.length >= 1,
    });

    const popularKnowledgeBasesQuery = useQuery({
        ...knowledgeQueries.popularOptions({
            isPublic: true,
            limit: 10,
        }),
        enabled: triggerType === '#' && triggerQuery.length === 0,
    });

    const knowledgeBasesQuery = useQuery({
        ...knowledgeQueries.searchOptions({
            query: triggerQuery,
            isPublic: true,
            limit: 10,
        }),
        enabled: triggerType === '#' && triggerQuery.length >= 1,
    });

    const suggestions = React.useMemo(() => {
        if (!triggerType) return [];

        if (triggerType === '@') {
            const packages = triggerQuery.length === 0
                ? (popularPackagesQuery.data?.data || [])
                : (packagesQuery.data?.data || []);

            return packages.map((pkg: any) => ({
                id: pkg.id || pkg.packageId,
                name: pkg.name,
                type: 'package' as const,
                description: pkg.shortDescription || pkg.description,
                iconUrl: pkg.iconUrl,
                displayValue: `@${pkg.name}`,
            }));
        } else if (triggerType === '#') {
            const knowledgeBases = triggerQuery.length === 0
                ? (popularKnowledgeBasesQuery.data?.data || [])
                : (knowledgeBasesQuery.data?.data || []);

            return knowledgeBases.map((kb: any) => {
                const kbData = kb.knowledge_bases || kb;
                const kbId = kbData.knowledgeBaseId || kb.knowledgeBaseId || kb.id;
                const kbName = kbData.name || kb.name;

                return {
                    id: kbId,
                    name: kbName,
                    type: 'knowledge-base' as const,
                    description: kbData.description || kb.description,
                    displayValue: `#${kbName}`,
                };
            });
        }

        return [];
    }, [triggerType, triggerQuery, popularPackagesQuery.data, packagesQuery.data, popularKnowledgeBasesQuery.data, knowledgeBasesQuery.data]);

    const isLoadingSuggestions = packagesQuery.isLoading || knowledgeBasesQuery.isLoading || popularPackagesQuery.isLoading || popularKnowledgeBasesQuery.isLoading;

    const getCurrentWordAtCursor = useCallback((textValue?: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return { word: '', start: 0, end: 0 };

        const cursorPos = textarea.selectionStart;
        const text = textValue !== undefined ? textValue : textarea.value;

        let start = cursorPos;
        while (start > 0 && /\S/.test(text[start - 1])) {
            start--;
        }

        let end = cursorPos;
        while (end < text.length && /\S/.test(text[end])) {
            end++;
        }

        const word = text.substring(start, end);
        return { word, start, end };
    }, []);

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setTextareaValue(value);

        const { word, start } = getCurrentWordAtCursor(value);

        if (word.startsWith('@') || word.startsWith('#')) {
            const trigger = word[0] as '@' | '#';
            const query = word.substring(1);

            setTriggerType(trigger);
            setTriggerQuery(query);
            setIsDropdownVisible(true);
        } else {
            setIsDropdownVisible(false);
            setTriggerType(null);
            setTriggerQuery('');
        }
    }, [getCurrentWordAtCursor]);

    const handleSuggestionSelect = useCallback((suggestion: any) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const { word, start, end } = getCurrentWordAtCursor(textareaValue);

        if (triggerType) {
            const mentionData: MentionData = {
                id: suggestion.id,
                name: suggestion.name,
                type: suggestion.type,
                description: suggestion.description,
                iconUrl: suggestion.iconUrl,
            };

            setMentions(prev => new Map(prev).set(suggestion.id, mentionData));

            const newValue = textareaValue.substring(0, start) + suggestion.displayValue + ' ' + textareaValue.substring(end);
            setTextareaValue(newValue);

            // Set cursor position after the mention
            setTimeout(() => {
                const newCursorPos = start + suggestion.displayValue.length + 1;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
            }, 0);
        }

        setIsDropdownVisible(false);
        setTriggerType(null);
        setTriggerQuery('');
    }, [getCurrentWordAtCursor, triggerType, textareaValue]);

    const handleSubmit = useCallback((message: PromptInputMessage) => {
        // Add mention data to the message
        const messageWithMentions = {
            ...message,
            text: message.text || textareaValue,
            mentions: Array.from(mentions.values()),
        };

        onSubmit(messageWithMentions);
        setTextareaValue('');
        setMentions(new Map());
    }, [onSubmit, textareaValue, mentions]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const input = commandInputRef.current;

        if (isDropdownVisible && triggerType && input) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                input.dispatchEvent(new KeyboardEvent("keydown", {
                    key: e.key,
                    code: e.code,
                    keyCode: e.keyCode,
                    which: e.which,
                    bubbles: true
                } as any));
            }
        } else if (e.key === "Enter") {
            // Don't submit if IME composition is in progress
            if (e.nativeEvent.isComposing) {
                return;
            }

            if (e.shiftKey) {
                // Allow newline
                return;
            }

            // Submit on Enter (without Shift)
            e.preventDefault();
            const form = (e.currentTarget as HTMLTextAreaElement).form;
            if (form) {
                form.requestSubmit();
            }
        }
    }, [isDropdownVisible, triggerType]);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            setIsDropdownVisible(false);
            setTriggerType(null);
            setTriggerQuery('');
        }, 150);
    }, []);

    return (
        <div className="relative">
            <PromptInput onSubmit={handleSubmit} accept="image/*" multiple>
                <PromptInputBody>
                    <PromptInputAttachments>
                        {(attachment) => (
                            <PromptInputAttachment data={attachment} />
                        )}
                    </PromptInputAttachments>
                    <div className="">
                        <PromptInputTextarea
                            ref={textareaRef}
                            placeholder={placeholder}
                            value={textareaValue}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                        />

                        {/* Dropdown for suggestions */}
                        <Command
                            ref={dropdownRef}
                            className={cn(
                                "absolute z-[99999] hidden h-auto max-h-64 max-w-sm overflow-y-auto border border-border bg-white shadow-lg rounded-md",
                                isDropdownVisible && "block"
                            )}
                        >
                            <div className="hidden">
                                <input
                                    ref={commandInputRef}
                                    value={`${triggerType || ''}${triggerQuery}`}
                                    onChange={() => { }}
                                />
                            </div>
                            <CommandList className="z-[99999] bg-white">
                                {isLoadingSuggestions ? (
                                    <CommandLoading>
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    </CommandLoading>
                                ) : suggestions.length === 0 ? (
                                    <CommandEmpty>
                                        <div className="p-4 text-sm text-muted-foreground">
                                            {triggerType === '@' ? 'No packages found' : 'No knowledge bases found'}
                                        </div>
                                    </CommandEmpty>
                                ) : (
                                    <CommandGroup className="z-[99999] bg-white">
                                        {suggestions.map((suggestion: any, i: number) => (
                                            <CommandItem
                                                key={`${suggestion.id}-${i}`}
                                                value={suggestion.displayValue}
                                                onSelect={() => handleSuggestionSelect(suggestion)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="size-6 rounded-md">
                                                        <AvatarImage src={suggestion.iconUrl} alt={suggestion.name} />
                                                        <AvatarFallback className="text-xs">
                                                            {suggestion.name?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate max-w-[300px]">
                                                            {suggestion.name}
                                                        </span>
                                                        {suggestion.description && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                                {suggestion.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </div>
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
                        <PromptInputSubmit status={isLoading ? "submitted" : undefined} />
                    </PromptInputToolbar>
                </PromptInputBody>
            </PromptInput>
        </div>
    );
}
