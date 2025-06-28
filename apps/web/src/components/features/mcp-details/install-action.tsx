import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallAction() {
	return (
		<Button>
			Install
			<Download className="h-4 w-4" />
		</Button>
	);
}
