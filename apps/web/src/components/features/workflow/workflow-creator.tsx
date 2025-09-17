import React, { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList, CommandLoading, CommandEmpty } from "@/components/ui/command";
import { chatQueries, packageQueries, knowledgeQueries } from "@/lib/queries";
import { useCreateAITemplateWorkflowMutation } from "@/lib/mutations";
import { cn } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";

// Utility functions for caret positioning
const properties = [
    "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontSizeAdjust", "lineHeight", "fontFamily",
    "textAlign", "textTransform", "textIndent", "textDecoration", "letterSpacing", "wordSpacing",
    "tabSize", "MozTabSize",
] as const;

function getCaretCoordinates(element: HTMLElement, position: number) {
    const div = document.createElement("div");
    div.id = "workflow-creator-caret-position-mirror";
    document.body.appendChild(div);

    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = "pre-wrap";
    style.wordWrap = "break-word";
    style.position = "absolute";
    style.visibility = "hidden";

    properties.forEach((prop) => {
        // @ts-expect-error
        style[prop] = computed[prop];
    });

    style.overflow = "hidden";

    // Get text content up to position
    const textContent = element.textContent || "";
    div.textContent = textContent.substring(0, position);

    const span = document.createElement("span");
    span.textContent = textContent.substring(position) || "";
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(computed["borderTopWidth"]),
        left: span.offsetLeft + parseInt(computed["borderLeftWidth"]),
        height: parseInt(computed["lineHeight"]),
    };

    document.body.removeChild(div);
    return coordinates;
}

// Mention data interface
interface MentionData {
    id: string;
    name: string;
    type: 'package' | 'knowledge-base';
    description?: string;
    iconUrl?: string;
}

interface WorkflowCreatorProps {
    className?: string;
    onWorkflowCreated?: () => void;
}

export function WorkflowCreator({ className, onWorkflowCreated }: WorkflowCreatorProps) {
    const [triggerType, setTriggerType] = useState<'@' | '#' | null>(null);
    const [triggerQuery, setTriggerQuery] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [mentions, setMentions] = useState<Map<string, MentionData>>(new Map());

    const editorRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const commandInputRef = useRef<HTMLInputElement>(null);

    const createAITemplateWorkflowMutation = useCreateAITemplateWorkflowMutation();

    // Get popular packages for @ trigger
    const popularPackagesQuery = useQuery({
        ...packageQueries.popularOptions(),
        enabled: triggerType === '@' && triggerQuery.length === 0,
    });

    // Search for packages when @ is triggered with search query
    const packagesQuery = useQuery({
        ...packageQueries.listOptions({
            search: triggerQuery,
            limit: 10,
            isLive: true,
        }),
        enabled: triggerType === '@' && triggerQuery.length >= 1,
    });

    // Get popular knowledge bases for # trigger
    const popularKnowledgeBasesQuery = useQuery({
        ...knowledgeQueries.popularOptions({
            isPublic: true,
            limit: 10,
        }),
        enabled: triggerType === '#' && triggerQuery.length === 0,
    });

    // Search for knowledge bases when # is triggered with search query
    const knowledgeBasesQuery = useQuery({
        ...knowledgeQueries.searchOptions({
            query: triggerQuery,
            isPublic: true,
            limit: 10,
        }),
        enabled: triggerType === '#' && triggerQuery.length >= 1,
    });

    // Get suggestions based on trigger type
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

    const isLoading = packagesQuery.isLoading || knowledgeBasesQuery.isLoading || popularPackagesQuery.isLoading || popularKnowledgeBasesQuery.isLoading;

    // Get current word at cursor
    const getCurrentWordAtCursor = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return { word: '', range: null };

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType !== Node.TEXT_NODE) return { word: '', range: null };

        const text = textNode.textContent || '';
        const caretPos = range.startOffset;

        // Find word boundaries
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

    // Handle input changes in contentEditable
    const handleInput = useCallback(() => {
        const editor = editorRef.current;
        const dropdown = dropdownRef.current;

        if (!editor || !dropdown) return;

        const { word, range } = getCurrentWordAtCursor();

        if (word.startsWith('@') || word.startsWith('#')) {
            const trigger = word[0] as '@' | '#';
            const query = word.substring(1);

            setTriggerType(trigger);
            setTriggerQuery(query);

            if (range) {
                const rect = range.getBoundingClientRect();
                const editorRect = editor.getBoundingClientRect();

                dropdown.style.left = (rect.left - editorRect.left) + "px";
                dropdown.style.top = (rect.bottom - editorRect.top) + "px";
                setIsDropdownVisible(true);
            }
        } else {
            setIsDropdownVisible(false);
            setTriggerType(null);
            setTriggerQuery('');
        }
    }, [getCurrentWordAtCursor]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((suggestion: any) => {
        const editor = editorRef.current;
        if (!editor) return;

        const { word, range } = getCurrentWordAtCursor();

        if (range && triggerType) {
            // Create mention span
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

            // Store mention data
            const mentionData: MentionData = {
                id: suggestion.id,
                name: suggestion.name,
                type: suggestion.type,
                description: suggestion.description,
                iconUrl: suggestion.iconUrl,
            };

            setMentions(prev => new Map(prev).set(suggestion.id, mentionData));

            // Replace the trigger text with mention span
            range.deleteContents();
            range.insertNode(mentionSpan);

            // Move cursor after the mention
            const newRange = document.createRange();
            newRange.setStartAfter(mentionSpan);
            newRange.setEndAfter(mentionSpan);

            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            // Add a space after mention
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

    // Convert editor content to XML format
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

    // Handle workflow creation
    const handleCreateWorkflow = useCallback(async () => {
        const editor = editorRef.current;
        if (!editor || createAITemplateWorkflowMutation.isPending) return;

        const xmlContent = convertToXMLFormat();
        if (!xmlContent.trim()) return;

        try {
            await createAITemplateWorkflowMutation.mutateAsync({
                prompt: xmlContent
            });

            // Reset editor
            editor.innerHTML = '';
            setMentions(new Map());
            onWorkflowCreated?.();
        } catch (error) {
            console.error('Failed to create workflow:', error);
        }
    }, [convertToXMLFormat, createAITemplateWorkflowMutation, onWorkflowCreated]);

    // Handle keyboard events
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
        }
    }, [isDropdownVisible, triggerType]);

    // Handle blur events
    const handleBlur = useCallback(() => {
        setTimeout(() => {
            setIsDropdownVisible(false);
            setTriggerType(null);
            setTriggerQuery('');
        }, 150);
    }, []);

    return (
        <div className={cn("", className)}>
            {/* Header */}
            <div className="mx-auto max-w-[496px] pb-2 text-center">
                <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
                    Add a Task or Workflow Description
                </h2>
                <span className="text-primary-300 text-sm">
                    Add context for your task or flow. Use @ to reference packages or # for knowledge bases.
                </span>
            </div>

            <div className="mx-auto flex max-w-md sm:max-w-full lg:max-w-[712px] flex-col gap-3 rounded-[18px] bg-primary-25 p-3 sm:p-4 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)] relative">
                {/* Rich Text Editor */}
                <div className="relative">
                    <div className="relative h-[120px] overflow-hidden">
                        <div
                            ref={editorRef}
                            contentEditable
                            className="w-full h-full resize-none rounded-[12px] border-none bg-primary-00 p-3 sm:p-4 pr-24 sm:pr-28 text-primary-700 focus:outline-none focus:ring-0 overflow-y-auto"
                            style={{
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                            }}
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            data-placeholder="Describe what you want to do..."
                            suppressContentEditableWarning={true}
                        />

                        <Button
                            onClick={handleCreateWorkflow}
                            disabled={createAITemplateWorkflowMutation.isPending}
                            className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 h-8 px-3 sm:h-9 sm:px-4 text-sm"
                        >
                            {createAITemplateWorkflowMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Create</span>
                                    <Search className="ml-1 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>

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
                        <CommandList>
                            {isLoading ? (
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
                                <CommandGroup>
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
            </div>



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