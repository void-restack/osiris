import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourcesTable } from "./sources";
import { UnitsCardsList } from "./units-list";
import { useState } from "react";
import { UnitsFilters } from "./units-filters";
import { useUnitsFilters } from "./use-units-filters";

export function KnowledgeHubTabs({ knowledgeBaseId }: {
	knowledgeBaseId: string;
}) {
	const [currentTab, setCurrentTab] = useState('Units');
	
	// Use the units filter hook to manage filter state
	const {
		filters,
		sortConfig,
		updateFilter,
		updateSort,
		resetFilters,
		filterOptions,
		hasActiveFilters
	} = useUnitsFilters({ knowledgeBaseId });

	return (
		<Tabs defaultValue="Units" className="flex w-full flex-col gap-y-8">
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 px-6 py-0">
				<TabsTrigger value="Units" onClick={() => setCurrentTab('Units')}>
					<ICONS.units /> Units
				</TabsTrigger>
				<TabsTrigger value="Source" onClick={() => setCurrentTab('Source')}>
					<ICONS.source /> Source
				</TabsTrigger>
				{currentTab === 'Units' && (
					<UnitsFilters
						filters={filters}
						sortConfig={sortConfig}
						onFilterChange={(key: string, value: any) => updateFilter(key as keyof typeof filters, value)}
						onSortChange={updateSort}
						onResetFilters={resetFilters}
						filterOptions={{
							sources: filterOptions.sources,
							tags: filterOptions.tags.map(tag => ({ label: String(tag.label), value: String(tag.value) }))
						}}
						hasActiveFilters={hasActiveFilters}
					/>
				)}
			</TabsList>
			<TabsContent className="px-6" value="Units">
				<UnitsCardsList 
					knowledgeBaseId={knowledgeBaseId}
					filters={filters}
					sortConfig={sortConfig}
				/>
			</TabsContent>
			<TabsContent className="px-6" value="Source">
				<SourcesTable />
			</TabsContent>
		</Tabs>
	);
}
