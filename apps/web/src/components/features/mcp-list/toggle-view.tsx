"use client";

import { ICONS } from "@/components/icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function McpViewToggle() {
	const { mcpView, setMcpView } = useAppStore();
	const activeClass = "!bg-white data-[state=on]:!bg-white";
	const inactiveClass = "!bg-transparent";

	const handleViewChange = (value: "list" | "directory") => {
		if (value === mcpView) return;
		setMcpView(value);
	};

	return (
		<ToggleGroup
			className="rounded-[6px] bg-[#F5F5F5] p-[2px]"
			type="single"
			value={mcpView}
			onValueChange={handleViewChange}
		>
			<ToggleGroupItem
				value="list"
				className={cn(
					"hover:!bg-white/90",
					mcpView === "list" ? activeClass : inactiveClass,
				)}
			>
				<ICONS.list stroke={mcpView === "list" ? "#000000" : "#A3A3A3"} />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="directory"
				className={cn(
					"hover:!bg-white/90",
					mcpView === "directory" ? activeClass : inactiveClass,
				)}
			>
				<ICONS.directory
					stroke={mcpView === "directory" ? "#000000" : "#A3A3A3"}
				/>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
