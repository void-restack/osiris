import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrowseKnowledgeBaseList } from "./browse-knowledge-base-list";
import { KnowledgeBaseViewToggle } from "./knowledge-base-view-toggle";
import { KnowledgeBaseFilters } from "./knowlege-base-filters";

export function KnowledgeBaseListContainer() {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="h-[72px] px-6" />
			<div className="flex w-full items-center justify-between px-6">
				<h3 className="w-full font-medium text-[#171717] text-xl">
					All Knowledge Hubs
				</h3>
				<div className="flex w-max items-center justify-end gap-4">
					<KnowledgeBaseViewToggle />
					<KnowledgeBaseFilters />
					<Button>
						Create Knowledge Base
						<Plus />
					</Button>
				</div>
			</div>
			<Separator />
			<div className="mt-5 px-6">
				<BrowseKnowledgeBaseList />
			</div>
		</div>
	);
}
