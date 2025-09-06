import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Package, Plus, X, Loader2, Check } from 'lucide-react';
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
import { packageQueries } from '@/lib/queries';
import type { PackageWithUserStatus } from '@/types';

interface McpSearchProps {
    selectedMcps: PackageWithUserStatus[];
    onToggleMcp: (pkg: PackageWithUserStatus) => void;
    placeholder?: string;
    maxSelections?: number;
}

export function McpSearch({
    selectedMcps,
    onToggleMcp,
    placeholder = "Search for MCPs...",
    maxSelections
}: McpSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce
    const queryClient = useQueryClient();

    // Search for MCPs with debounced query
    const { data: searchResults, isPending: isSearching } = useQuery({
        queryKey: ['packages', 'search', debouncedSearchQuery],
        queryFn: async () => {
            if (!debouncedSearchQuery || debouncedSearchQuery.length < 1) return [];

            const response = await queryClient.ensureQueryData(packageQueries.listOptions({
                search: debouncedSearchQuery,
                page: 1,
                limit: 12
            }));

            return (response.data || []).map((pkg: any): PackageWithUserStatus => ({
                ...pkg,
                isDeployed: false, // We'll handle deployment separately
                clientId: pkg.packageId
            }));
        },
        enabled: debouncedSearchQuery.length > 0,
        staleTime: 30000, // Cache results for 30 seconds
    });

    // Get popular MCPs when no search query
    const { data: popularPackages, isError: isPopularError, isPending: isLoadingPopular } = useQuery({
        ...packageQueries.listOptions({
            page: 1,
            limit: 8,
            sortBy: 'createdAt', // Use valid sortBy parameter
            sortOrder: 'desc'
        }),
        retry: 1, // Retry once on failure
    });

    const displayPackages = useMemo(() => {
        if (debouncedSearchQuery.length > 0) {
            return searchResults || [];
        }
        // Show popular packages or empty array if there's an error
        if (isPopularError) {
            return [];
        }
        return (popularPackages?.data || []).map((pkg: any): PackageWithUserStatus => ({
            ...pkg,
            isDeployed: false,
            clientId: pkg.packageId
        }));
    }, [debouncedSearchQuery, searchResults, popularPackages, isPopularError]);

    const isSelected = useCallback((pkg: PackageWithUserStatus) => {
        return selectedMcps.some(selected => selected.packageId === pkg.packageId);
    }, [selectedMcps]);

    const canSelectMore = useMemo(() => {
        if (!maxSelections) return true;
        return selectedMcps.length < maxSelections;
    }, [selectedMcps.length, maxSelections]);

    const handleSelect = useCallback((pkg: PackageWithUserStatus) => {
        const selected = isSelected(pkg);

        // If selecting and at max limit, prevent selection
        if (!selected && !canSelectMore) {
            return;
        }

        onToggleMcp(pkg);
        // Keep the command palette open for multiple selections
        // setOpen(false); 
    }, [isSelected, canSelectMore, onToggleMcp]);

    // Clear search when popover closes
    const handleOpenChange = useCallback((newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSearchQuery('');
        }
    }, []);

    const removeSelected = useCallback((pkg: PackageWithUserStatus) => {
        onToggleMcp(pkg);
    }, [onToggleMcp]);

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
                                    return <CommandLoading>Searching MCPs...</CommandLoading>;
                                }

                                if (displayPackages.length === 0) {
                                    return (
                                        <CommandEmpty>
                                            {isPopularError
                                                ? 'Failed to load MCPs'
                                                : debouncedSearchQuery.length > 0
                                                    ? 'No MCPs found'
                                                    : 'No popular MCPs available'
                                            }
                                        </CommandEmpty>
                                    );
                                }

                                const searchResults = debouncedSearchQuery.length > 0 ? displayPackages : [];
                                const popularResults = debouncedSearchQuery.length === 0 ? displayPackages : [];

                                return (
                                    <>
                                        {popularResults.length > 0 && (
                                            <CommandGroup heading="Popular MCPs">
                                                {popularResults.map((pkg: PackageWithUserStatus) => {
                                                    const selected = isSelected(pkg);
                                                    const canSelect = selected || canSelectMore;

                                                    return (
                                                        <CommandItem
                                                            key={pkg.packageId}
                                                            disabled={!canSelect}
                                                            onSelect={() => canSelect && handleSelect(pkg)}
                                                            className="flex items-center gap-3 p-3"
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
                                                                <AvatarFallback>
                                                                    {pkg.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{pkg.name}</div>
                                                                {pkg.shortDescription && (
                                                                    <div className="text-xs text-muted-foreground truncate">
                                                                        {pkg.shortDescription}
                                                                    </div>
                                                                )}
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
                                                {searchResults.map((pkg: PackageWithUserStatus) => {
                                                    const selected = isSelected(pkg);
                                                    const canSelect = selected || canSelectMore;

                                                    return (
                                                        <CommandItem
                                                            key={pkg.packageId}
                                                            disabled={!canSelect}
                                                            onSelect={() => canSelect && handleSelect(pkg)}
                                                            className="flex items-center gap-3 p-3"
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
                                                                <AvatarFallback>
                                                                    {pkg.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{pkg.name}</div>
                                                                {pkg.shortDescription && (
                                                                    <div className="text-xs text-muted-foreground truncate">
                                                                        {pkg.shortDescription}
                                                                    </div>
                                                                )}
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

            {/* Selected MCPs Pills */}
            {selectedMcps.length > 0 && (
                <div className="space-y-2">
                    {/* <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                            Selected MCPs ({selectedMcps.length}{maxSelections ? `/${maxSelections}` : ''})
                        </span>
                    </div> */}
                    <div className="flex flex-wrap gap-2">
                        {selectedMcps.map((pkg) => (
                            <Badge
                                key={pkg.packageId}
                                variant="secondary"
                                className="flex items-center gap-2 px-3 py-1.5"
                            >
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
                                    <AvatarFallback className="text-xs">
                                        {pkg.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{pkg.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 hover:bg-transparent"
                                    onClick={() => removeSelected(pkg)}
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
