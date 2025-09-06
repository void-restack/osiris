import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, BookOpen, Plus, X, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandLoading,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { knowledgeQueries } from '@/lib/queries';

interface KnowledgeBase {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    isPublic?: boolean;
    createdAt?: string;
}

interface KnowledgeBaseSearchProps {
    selectedKnowledgeBases: KnowledgeBase[];
    onToggleKnowledgeBase: (kb: KnowledgeBase) => void;
    placeholder?: string;
    maxSelections?: number;
}

export function KnowledgeBaseSearch({
    selectedKnowledgeBases,
    onToggleKnowledgeBase,
    placeholder = "Search for Knowledge Bases...",
    maxSelections
}: KnowledgeBaseSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce
    const queryClient = useQueryClient();

    // Search for Knowledge Bases with debounced query
    const { data: searchResults, isPending: isSearching } = useQuery({
        queryKey: ['knowledge-base', 'search', debouncedSearchQuery],
        queryFn: async () => {
            if (!debouncedSearchQuery || debouncedSearchQuery.length < 1) return [];

            const response = await queryClient.ensureQueryData(knowledgeQueries.basesOptions({
                search: debouncedSearchQuery,
                page: 1,
                limit: 12,
                isPublic: true, // Only show public knowledge bases for now
            }));

            return response.data || [];
        },
        enabled: debouncedSearchQuery.length > 0,
        staleTime: 30000, // Cache results for 30 seconds
    });

    // Get popular Knowledge Bases when no search query
    const { data: popularKnowledgeBases, isError: isPopularError, isPending: isLoadingPopular } = useQuery({
        ...knowledgeQueries.basesOptions({
            page: 1,
            limit: 8,
            isPublic: true,
            sortBy: 'recent', // Use valid sortBy parameter
            sortOrder: 'desc'
        }),
        retry: 1, // Retry once on failure
    });

    const displayKnowledgeBases = useMemo(() => {
        if (debouncedSearchQuery.length > 0) {
            return searchResults || [];
        }
        // Show popular knowledge bases or empty array if there's an error
        if (isPopularError) {
            return [];
        }
        return popularKnowledgeBases?.data || [];
    }, [debouncedSearchQuery, searchResults, popularKnowledgeBases, isPopularError]);

    const isSelected = useCallback((kb: KnowledgeBase) => {
        return selectedKnowledgeBases.some(selected => selected.id === kb.id);
    }, [selectedKnowledgeBases]);

    const canSelectMore = useMemo(() => {
        if (!maxSelections) return true;
        return selectedKnowledgeBases.length < maxSelections;
    }, [selectedKnowledgeBases.length, maxSelections]);

    const handleSelect = useCallback((kb: KnowledgeBase) => {
        const selected = isSelected(kb);

        // If selecting and at max limit, prevent selection
        if (!selected && !canSelectMore) {
            return;
        }

        onToggleKnowledgeBase(kb);
        // Keep the command palette open for multiple selections
        // setOpen(false); 
    }, [isSelected, canSelectMore, onToggleKnowledgeBase]);

    const removeSelected = useCallback((kb: KnowledgeBase) => {
        onToggleKnowledgeBase(kb);
    }, [onToggleKnowledgeBase]);

    // Clear search when popover closes
    const handleOpenChange = useCallback((newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSearchQuery('');
        }
    }, []);

    return (
        <div className="space-y-4">
            {/* Command Palette */}
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            <span className="text-muted-foreground">{placeholder}</span>
                        </div>
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={placeholder}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            {(() => {
                                const isTyping = searchQuery.length > 0 && searchQuery !== debouncedSearchQuery;
                                const isCurrentlySearching = debouncedSearchQuery.length > 0 && isSearching;
                                const isLoadingInitial = debouncedSearchQuery.length === 0 && isLoadingPopular;

                                if (isTyping || isCurrentlySearching || isLoadingInitial) {
                                    return <CommandLoading>Searching Knowledge Bases...</CommandLoading>;
                                }

                                if (displayKnowledgeBases.length === 0) {
                                    return (
                                        <CommandEmpty>
                                            {isPopularError
                                                ? 'Failed to load Knowledge Bases'
                                                : debouncedSearchQuery.length > 0
                                                    ? 'No Knowledge Bases found'
                                                    : 'No popular Knowledge Bases available'
                                            }
                                        </CommandEmpty>
                                    );
                                }

                                const searchResults = debouncedSearchQuery.length > 0 ? displayKnowledgeBases : [];
                                const popularResults = debouncedSearchQuery.length === 0 ? displayKnowledgeBases : [];

                                return (
                                    <>
                                        {popularResults.length > 0 && (
                                            <CommandGroup heading="Popular Knowledge Bases">
                                                {popularResults.map((kb: KnowledgeBase) => {
                                                    const selected = isSelected(kb);
                                                    const canSelect = selected || canSelectMore;

                                                    return (
                                                        <CommandItem
                                                            key={kb.id}
                                                            disabled={!canSelect}
                                                            onSelect={() => canSelect && handleSelect(kb)}
                                                            className="flex items-center gap-3 p-3"
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={kb.imageUrl} alt={kb.name} />
                                                                <AvatarFallback>
                                                                    <BookOpen className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{kb.name}</div>
                                                                {kb.description && (
                                                                    <div className="text-xs text-muted-foreground truncate">
                                                                        {kb.description}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    {kb.isPublic && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Public
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {selected && (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        )}

                                        {searchResults.length > 0 && (
                                            <CommandGroup heading="Search Results">
                                                {searchResults.map((kb: KnowledgeBase) => {
                                                    const selected = isSelected(kb);
                                                    const canSelect = selected || canSelectMore;

                                                    return (
                                                        <CommandItem
                                                            key={kb.id}
                                                            disabled={!canSelect}
                                                            onSelect={() => canSelect && handleSelect(kb)}
                                                            className="flex items-center gap-3 p-3"
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={kb.imageUrl} alt={kb.name} />
                                                                <AvatarFallback>
                                                                    <BookOpen className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{kb.name}</div>
                                                                {kb.description && (
                                                                    <div className="text-xs text-muted-foreground truncate">
                                                                        {kb.description}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    {kb.isPublic && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Public
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {selected && (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        )}
                                    </>
                                );
                            })()}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected Knowledge Bases Pills */}
            {selectedKnowledgeBases.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                            Selected Knowledge Bases ({selectedKnowledgeBases.length}{maxSelections ? `/${maxSelections}` : ''})
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedKnowledgeBases.map((kb) => (
                            <Badge
                                key={kb.id}
                                variant="secondary"
                                className="flex items-center gap-2 px-3 py-1.5"
                            >
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src={kb.imageUrl} alt={kb.name} />
                                    <AvatarFallback className="text-xs">
                                        <BookOpen className="h-2.5 w-2.5" />
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{kb.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 hover:bg-transparent"
                                    onClick={() => removeSelected(kb)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
