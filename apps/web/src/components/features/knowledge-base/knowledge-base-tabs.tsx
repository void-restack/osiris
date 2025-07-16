import { ICONS } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourcesTable } from "./sources";
import { UnitsCardsList } from "./units-list";

export function KnowledgeHubTabs() {
	return (
		<Tabs defaultValue="Source" className="flex w-full flex-col gap-y-8">
			<TabsList className="flex h-12 w-full justify-start border-b border-b-primary-100 px-6 py-0">
				<TabsTrigger value="Units">
					<ICONS.units /> Units
				</TabsTrigger>
				<TabsTrigger value="Source">
					<ICONS.source /> Source
				</TabsTrigger>
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
