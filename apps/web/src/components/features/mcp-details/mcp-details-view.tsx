import { Tag } from "lucide-react";
import { ICONS } from "@/components/icons";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import { WeeklyDownloadsChart } from "./weekly-downloads-chart";

// Simple time ago utility
function getTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();

	const minutes = Math.floor(diffInMs / (1000 * 60));
	const hours = Math.floor(diffInMs / (1000 * 60 * 60));
	const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (minutes < 60) {
		return `${minutes}min ago`;
	} else if (hours < 24) {
		return `${hours}hr ago`;
	} else {
		return `${days}d ago`;
	}
}

export function McpDetailsView() {
	const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
	const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(mcpId));

	if (!packageData) {
		return (
			<div className="w-full max-w-[344px] h-fit shrink-0 rounded-lg border border-primary-100">
				<div className="flex items-center gap-1 bg-primary-25 px-4 py-3 text-primary-300 text-sm">
					<ICONS.readme />
					<p>MCP details</p>
				</div>
				<div className="flex w-full flex-col gap-4 p-4 text-primary-300 text-sm">
					<div className="text-center py-8">
						<p className="text-primary-600">Loading package details...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-[344px] h-fit shrink-0 rounded-lg border border-primary-100">
			<div className="flex items-center gap-1 bg-primary-25 px-4 py-3 text-primary-300 text-sm">
				<ICONS.readme />
				<p>MCP details</p>
			</div>
			<div className="flex w-full flex-col gap-4 p-4 text-primary-300 text-sm">
				<div className="flex items-center justify-between">
					<p>Mcp Type</p>
					<p>{packageData.type ? String(packageData.type).toUpperCase() : "Unknown"}</p>
				</div>
				<div className="flex items-center justify-between">
					<p>Credits Required</p>
					{packageData.paymentConfig !== null ? packageData.paymentConfig?.credits : "Free"}
				</div>
				<div className="flex items-center justify-between">
					<p>Publisher</p>
					<p className="text-right truncate max-w-32" title={(packageData.publisher.name ?? packageData.publisherId) || "Unknown"}>
						{(packageData.publisher.name === "super_admin" ? "Osiris" : packageData.publisher.name) ?? (packageData.publisherId ? String(packageData.publisherId).slice(0, 4) + "..." + String(packageData.publisherId).slice(-4) : "Unknown")}
					</p>
				</div>
				<div className="flex items-center justify-between">
					<p>Version</p>
					<p>{packageData.latestVersion || "Unknown"}</p>
				</div>

				{/* Weekly Downloads Chart */}
				<div className="pt-2 border-t border-primary-100">
					<WeeklyDownloadsChart packageId={mcpId} />
				</div>

				{/* Last Published */}
				{/* <div className="flex items-center justify-between pt-2 border-t border-primary-100">
					<pre>{JSON.stringify(packageData, null, 2)}</pre>
				</div> */}
			</div>
		</div>
	);
}
