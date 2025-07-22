import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourcesTable } from "./sources";
import { UnitsCardsList } from "./units-list";
import { useState } from "react";
import { UnitsFilters } from "./units-filters";

export function KnowledgeHubTabs() {
	const [sortBy, setSortBy] = useState("latest");
	const [currentTab, setCurrentTab] = useState('Units')
	return (
		<Tabs defaultValue="Units" className="flex w-full flex-col gap-y-8">
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 px-6 py-0">
				<TabsTrigger value="Units" onClick={() => setCurrentTab('Units')}>
					<ICONS.units /> Units
				</TabsTrigger>
				<TabsTrigger value="Source" onClick={() => setCurrentTab('Source')}>
					<ICONS.source /> Source
				</TabsTrigger>
				{
					currentTab === 'Units' && <UnitsFilters sortBy={sortBy} onSortByChange={setSortBy} />
				}
			</TabsList>
			<TabsContent className="px-6" value="Units">
				<UnitsCardsList />
			</TabsContent>
			<TabsContent className="px-6" value="Source">
				<SourcesTable />
			</TabsContent>
		</Tabs>
	);
}
