import { ICONS } from "@/components/icons";
import { Tag } from "lucide-react";

export function McpDetailsView() {
	return (
		<div className="border border-primary-100 rounded-lg w-full max-w-[344px] shrink-0">
            <div className="text-sm text-primary-300 flex items-center gap-1 py-3 px-4 bg-primary-25">
                <ICONS.readme />
                <p>MCP details</p>
            </div>
            <div className="flex flex-col gap-4 p-4 w-full text-primary-300 text-sm">
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