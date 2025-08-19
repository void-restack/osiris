import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourcesTable } from "./sources";
import { UnitsCardsList } from "./units-list";
import { UnitsFilters } from "./units-filters";
import { useUnitsFilters } from "./use-units-filters";
import { useQueryState } from "nuqs";

export function KnowledgeHubTabs({ knowledgeBaseId }: {
	knowledgeBaseId: string;
}) {
	const [searchParams, setSearchParams] = useQueryState("tab", { defaultValue: "Units" });
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
		<Tabs value={searchParams} defaultValue="Units" className="flex w-full flex-col gap-y-8">
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 px-6 py-0">
				<TabsTrigger value="Source" onClick={() => setSearchParams("Source")}>
					<ICONS.source /> Source
				</TabsTrigger>
				<TabsTrigger value="Units" onClick={() => setSearchParams("Units")}>
					<ICONS.units /> Units
				</TabsTrigger>
				{searchParams === 'Units' && (
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
			<TabsContent className="px-6" value={"Source"}>
				<SourcesTable />
			</TabsContent>
			<TabsContent className="px-6" value={"Units"}>
				<UnitsCardsList
					knowledgeBaseId={knowledgeBaseId}
					filters={filters}
					sortConfig={sortConfig}
				/>
			</TabsContent>
		</Tabs>
	);
}
