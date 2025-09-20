import React, { useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandGroup, CommandItem, CommandList, CommandLoading, CommandEmpty, CommandInput } from "@/components/ui/command";
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
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, side: 'bottom' as 'top' | 'bottom' });

    const editorRef = useRef<HTMLDivElement>(null);
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

    const getCurrentWordAtCursor = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return { word: '', range: null };

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType !== Node.TEXT_NODE) return { word: '', range: null };

        const text = textNode.textContent || '';
        const caretPos = range.startOffset;

        let start = caretPos;
        while (start > 0 && /\S/.test(text[start - 1])) {
            start--;
        }

        let end = caretPos;
        while (end < text.length && /\S/.test(text[end])) {
            end++;
        }

        const word = text.substring(start, end);

        // Create range for the word
        const wordRange = document.createRange();
        wordRange.setStart(textNode, start);
        wordRange.setEnd(textNode, end);

        return { word, range: wordRange };
    }, []);

    const getCursorPosition = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return { x: 0, y: 0 };

        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return { x: 0, y: 0 };

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();

        return {
            x: rect.left - editorRect.left,
            y: rect.bottom - editorRect.top
        };
    }, []);

    const calculateDropdownPosition = useCallback((cursorPos: { x: number, y: number }) => {
        const editor = editorRef.current;
        if (!editor) return { x: cursorPos.x, y: cursorPos.y + 20, side: 'bottom' as const };

        const editorRect = editor.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 256; // max-h-64 = 16rem = 256px
        const dropdownWidth = editorRect.width; // Match editor width

        // Calculate horizontal position with collision detection
        let x = cursorPos.x;
        const editorLeft = editorRect.left;

        // If dropdown would go off the right edge, align it to the right
        if (editorLeft + x + dropdownWidth > viewportWidth) {
            x = Math.max(0, viewportWidth - editorLeft - dropdownWidth - 8); // 8px margin
        }

        // If dropdown would go off the left edge, align it to the left
        if (editorLeft + x < 8) { // 8px margin
            x = 8 - editorLeft;
        }

        // Calculate vertical position with collision detection
        const spaceBelow = viewportHeight - (editorRect.top + cursorPos.y + 24);
        const spaceAbove = editorRect.top + cursorPos.y - 8;

        // If there's not enough space below but enough space above, position above
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            return {
                x,
                y: cursorPos.y - dropdownHeight - 8, // 8px gap above
                side: 'top' as const
            };
        }

        // Default to below
        return {
            x,
            y: cursorPos.y + 24, // 24px gap below (20px + 4px extra)
            side: 'bottom' as const
        };
    }, []);

    const handleInput = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const { word, range } = getCurrentWordAtCursor();

        if (word.startsWith('@') || word.startsWith('#')) {
            const trigger = word[0] as '@' | '#';
            const query = word.substring(1);

            setTriggerType(trigger);
            setTriggerQuery(query);

            const position = getCursorPosition();
            setCursorPosition(position);

            const dropdownPos = calculateDropdownPosition(position);
            setDropdownPosition(dropdownPos);

            setIsDropdownVisible(true);
        } else {
            setIsDropdownVisible(false);
            setTriggerType(null);
            setTriggerQuery('');
        }
    }, [getCurrentWordAtCursor, getCursorPosition, calculateDropdownPosition]);

    const handleSuggestionSelect = useCallback((suggestion: any) => {
        const editor = editorRef.current;
        if (!editor) return;

        const { word, range } = getCurrentWordAtCursor();

        if (range && triggerType) {
            const mentionSpan = document.createElement('span');
            mentionSpan.className = cn(
                'inline-flex items-center px-1 rounded-sm font-medium',
                suggestion.type === 'package'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
            );
            mentionSpan.contentEditable = 'false';
            mentionSpan.setAttribute('data-mention-id', suggestion.id);
            mentionSpan.setAttribute('data-mention-type', suggestion.type);
            mentionSpan.setAttribute('data-mention-name', suggestion.name);
            mentionSpan.textContent = suggestion.displayValue;

            const mentionData: MentionData = {
                id: suggestion.id,
                name: suggestion.name,
                type: suggestion.type,
                description: suggestion.description,
                iconUrl: suggestion.iconUrl,
            };

            setMentions(prev => new Map(prev).set(suggestion.id, mentionData));

            range.deleteContents();
            range.insertNode(mentionSpan);

            const newRange = document.createRange();
            newRange.setStartAfter(mentionSpan);
            newRange.setEndAfter(mentionSpan);

            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            const spaceNode = document.createTextNode(' ');
            newRange.insertNode(spaceNode);
            newRange.setStartAfter(spaceNode);
            newRange.setEndAfter(spaceNode);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
        }

        setIsDropdownVisible(false);
        setTriggerType(null);
        setTriggerQuery('');
        editor.focus();
    }, [getCurrentWordAtCursor, triggerType]);

    const convertToXMLFormat = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return '';

        let result = '';

        const processNode = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || '';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;

                if (element.hasAttribute('data-mention-id')) {
                    const id = element.getAttribute('data-mention-id');
                    const type = element.getAttribute('data-mention-type');
                    const name = element.getAttribute('data-mention-name');
                    const mentionData = mentions.get(id!);

                    if (type === 'package') {
                        return `<package id="${id}" name="${name}"${mentionData?.description ? ` description="${mentionData.description}"` : ''}>${name}</package>`;
                    } else if (type === 'knowledge-base') {
                        return `<knowledge-base id="${id}" name="${name}"${mentionData?.description ? ` description="${mentionData.description}"` : ''}>${name}</knowledge-base>`;
                    }
                }

                // Process child nodes
                let childContent = '';
                for (let i = 0; i < node.childNodes.length; i++) {
                    childContent += processNode(node.childNodes[i]);
                }
                return childContent;
            }

            return '';
        };

        for (let i = 0; i < editor.childNodes.length; i++) {
            result += processNode(editor.childNodes[i]);
        }

        return result.trim();
    }, [mentions]);

    const handleSubmit = useCallback((message: PromptInputMessage) => {
        const editor = editorRef.current;
        if (!editor) return;

        // Convert editor content to XML format
        const xmlContent = convertToXMLFormat();
        if (!xmlContent.trim()) return;

        // Add mention data to the message
        const messageWithMentions = {
            ...message,
            text: xmlContent,
            mentions: Array.from(mentions.values()),
        };

        onSubmit(messageWithMentions);

        // Reset editor
        editor.innerHTML = '';
        setMentions(new Map());
    }, [onSubmit, mentions, convertToXMLFormat]);

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
                        <div
                            ref={editorRef}
                            contentEditable
                            className="w-full min-h-[60px] resize-none rounded-md bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                            }}
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            data-placeholder={placeholder}
                            suppressContentEditableWarning={true}
                        />

                        {/* Dropdown for suggestions */}
                        <Command
                            ref={dropdownRef}
                            className={cn(
                                "absolute z-[99999] hidden h-auto max-h-64 overflow-y-auto border border-border bg-background shadow-lg rounded-md",
                                isDropdownVisible && "block"
                            )}
                            style={{
                                left: dropdownPosition.x,
                                top: dropdownPosition.y,
                                width: editorRef.current?.getBoundingClientRect().width || 'auto',
                            }}
                        >
                            <div className="hidden">
                                <input
                                    ref={commandInputRef}
                                    value={`${triggerType || ''}${triggerQuery}`}
                                    onChange={() => { }}
                                />
                            </div>
                            <CommandList className="z-[99999] bg-background">
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
                                    <CommandGroup className="z-[99999] bg-background">
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

            {/* Add placeholder styling */}
            <style>{`
                [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: rgb(156 163 175);
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
