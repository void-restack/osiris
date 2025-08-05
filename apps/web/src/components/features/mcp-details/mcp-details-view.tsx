import { Tag } from "lucide-react";
import { ICONS } from "@/components/icons";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";

export function McpDetailsView() {
	const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
	const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(mcpId));

	return (
		<div className="w-full max-w-[344px] shrink-0 rounded-lg border border-primary-100">
			<div className="flex items-center gap-1 bg-primary-25 px-4 py-3 text-primary-300 text-sm">
				<ICONS.readme />
				<p>MCP details</p>
			</div>
			<div className="flex w-full flex-col gap-4 p-4 text-primary-300 text-sm">
				<div className="flex items-center justify-between">
					<p>Mcp Type</p>
					<p>{packageData?.type || "Unknown"}</p>
				</div>
				<div className="flex items-center justify-between">
					<p>Credits Required</p>
					<Tag>{packageData?.paymentConfig?.credits || "Free"}</Tag>
				</div>
				<div className="flex items-center justify-between">
					<p>Publisher</p>
					<p className="text-right truncate max-w-32" title={packageData?.publisherId || "Unknown"}>
						{packageData?.publisherId || "Unknown"}
					</p>
				</div>
				<div className="flex items-center justify-between">
					<p>Version</p>
					<p>{packageData?.latestVersion || "Unknown"}</p>
				</div>
			</div>
		</div>
	);
}
