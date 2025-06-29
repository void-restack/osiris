import { Tag } from "lucide-react";
import { ICONS } from "@/components/icons";

export function McpDetailsView() {
	return (
		<div className="w-full max-w-[344px] shrink-0 rounded-lg border border-primary-100">
			<div className="flex items-center gap-1 bg-primary-25 px-4 py-3 text-primary-300 text-sm">
				<ICONS.readme />
				<p>MCP details</p>
			</div>
			<div className="flex w-full flex-col gap-4 p-4 text-primary-300 text-sm">
				<div className="flex items-center justify-between">
					<p>Mcp Type</p>
					<p>Assistant</p>
				</div>
				<div className="flex items-center justify-between">
					<p>Credits Required</p>
					<Tag>100</Tag>
				</div>
			</div>
		</div>
	);
}
