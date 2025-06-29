import { ICONS } from "@/components/icons";

export function McpListZeroState({
	similarMcps,
}: {
	similarMcps?: React.ReactNode;
}) {
	return (
		<div className="gapy-3 flex h-full w-full flex-col items-center justify-center">
			<ICONS.mcpZeroState />
			<div className="flex flex-col items-center gap-2 text-[#737373]">
				<h1 className="font-medium">No results to show</h1>
				<p className="text-[#A3A3A3] text-sm">
					Looks like it’s a bit empty here. Let’s try a different search!
				</p>
			</div>
			{similarMcps}
		</div>
	);
}
