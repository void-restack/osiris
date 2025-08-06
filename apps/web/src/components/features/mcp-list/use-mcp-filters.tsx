import { useState, useMemo } from 'react';
import type { PackageWithUserStatus } from "@/types";

export interface McpFilterOptions {
    searchQuery: string;
    status: string[];
    installationStatus: string[];
    tags: string[];
    publisher: string[];
    dateRange: [Date, Date] | null;
}

export interface McpSortConfig {
    field: 'relevant' | 'latest' | 'name' | 'publisher';
    direction: 'asc' | 'desc';
}

interface UseMcpFiltersProps {
    packages: PackageWithUserStatus[];
}

export function useMcpFilters({ packages }: UseMcpFiltersProps) {
    const [filters, setFilters] = useState<McpFilterOptions>({
        searchQuery: '',
        status: [],
        installationStatus: [],
        tags: [],
        publisher: [],
        dateRange: null,
    });

    const [sortConfig, setSortConfig] = useState<McpSortConfig>({
        field: 'relevant',
        direction: 'desc',
    });

    // Filter options derived from data
    const filterOptions = useMemo(() => {
        const allTags = new Set<string>();
        const allPublishers = new Set<string>();

        packages.forEach(pkg => {
            if (pkg.metadata?.tags) {
                pkg.metadata.tags.forEach((tag: string) => allTags.add(tag));
            }
            allPublishers.add(pkg.publisherId);
        });

        const dateExtent = packages.reduce(
            (extent, pkg) => {
                const date = new Date(pkg.createdAt);
                return {
                    min: extent.min < date ? extent.min : date,
                    max: extent.max > date ? extent.max : date,
                };
            },
            { min: new Date(), max: new Date(0) }
        );

        return {
            statuses: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
            ],
            installationStatuses: [
                { label: "Installed", value: "installed" },
                { label: "Not Installed", value: "not_installed" },
                { label: "Deployed", value: "deployed" },
            ],
            tags: Array.from(allTags).map(tag => ({ label: tag, value: tag })),
            publishers: Array.from(allPublishers).map(pub => ({ label: pub, value: pub })),
            dateRange: dateExtent,
        };
    }, [packages]);

    // Filtered and sorted packages
    const filteredPackages = useMemo(() => {
        let result = [...packages];

        // Apply search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(pkg =>
                pkg.name.toLowerCase().includes(query) ||
                pkg.description.toLowerCase().includes(query) ||
                (pkg.metadata?.tags || []).some((tag: string) =>
                    tag.toLowerCase().includes(query)
                )
            );
        }

        // Apply status filter
        if (filters.status.length > 0) {
            result = result.filter(pkg => {
                const status = pkg.isActive ? 'active' : 'inactive';
                return filters.status.includes(status);
            });
        }

        // Apply installation status filter
        if (filters.installationStatus.length > 0) {
            result = result.filter(pkg => {
                const statuses = [];
                if (pkg.isInstalled) statuses.push('installed');
                if (pkg.isDeployed) statuses.push('deployed');
                if (!pkg.isInstalled && !pkg.isDeployed) statuses.push('not_installed');

                return filters.installationStatus.some(filterStatus =>
                    statuses.includes(filterStatus)
                );
            });
        }

        // Apply tags filter
        if (filters.tags.length > 0) {
            result = result.filter(pkg => {
                const pkgTags = pkg.metadata?.tags || [];
                return filters.tags.some(filterTag =>
                    pkgTags.some((tag: string) => tag.toLowerCase().includes(filterTag.toLowerCase()))
                );
            });
        }

        // Apply publisher filter
        if (filters.publisher.length > 0) {
            result = result.filter(pkg =>
                filters.publisher.includes(pkg.publisherId)
            );
        }

        // Apply date range filter
        if (filters.dateRange) {
            const [startDate, endDate] = filters.dateRange;
            result = result.filter(pkg => {
                const pkgDate = new Date(pkg.createdAt);
                return pkgDate >= startDate && pkgDate <= endDate;
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

            switch (sortConfig.field) {
                case 'name':
                    return multiplier * a.name.localeCompare(b.name);
                case 'publisher':
                    return multiplier * a.publisherId.localeCompare(b.publisherId);
                case 'latest':
                    return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                case 'relevant':
                default:
                    // Prioritize installed, then active packages, then by name
                    if (a.isInstalled !== b.isInstalled) {
                        return multiplier * (a.isInstalled ? -1 : 1);
                    }
                    if (a.isActive !== b.isActive) {
                        return multiplier * (a.isActive ? -1 : 1);
                    }
                    return multiplier * a.name.localeCompare(b.name);
            }
        });

        return result;
    }, [packages, filters, sortConfig]);

    const updateFilter = <K extends keyof McpFilterOptions>(
        key: K,
        value: McpFilterOptions[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const updateSort = (
        field: McpSortConfig['field'],
        direction?: McpSortConfig['direction']
    ) => {
        setSortConfig(prev => ({
            field,
            direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'),
        }));
    };

    const resetFilters = () => {
        setFilters({
            searchQuery: '',
            status: [],
            installationStatus: [],
            tags: [],
            publisher: [],
            dateRange: null,
        });
        setSortConfig({ field: 'relevant', direction: 'desc' });
    };

    const hasActiveFilters = useMemo(() => {
        return (
            filters.searchQuery !== '' ||
            filters.status.length > 0 ||
            filters.installationStatus.length > 0 ||
            filters.tags.length > 0 ||
            filters.publisher.length > 0 ||
            filters.dateRange !== null
        );
    }, [filters]);

    return {
        filters,
        sortConfig,
        filteredPackages,
        updateFilter,
        updateSort,
        resetFilters,
        filterOptions,
        hasActiveFilters,
    };
}
