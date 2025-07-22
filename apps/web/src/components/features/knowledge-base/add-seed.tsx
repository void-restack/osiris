import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddSeedsAction() {
	return (
		<Button>
			Add more seeds
			<Plus className="h-4 w-4" />
		</Button>
	);
}
