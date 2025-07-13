"use client";

import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function KnowledgeBaseFilters() {
	return (
		<div className="flex w-full items-center gap-2">
			<SortByMenu />
		</div>
	);
}

const sortByOptions = [
	{
		label: "Latest",
		value: "latest",
	},
	{
		label: "Relevance",
		value: "relevance",
	},
	{
		label: "New",
		value: "new",
	},
];

export function SortByMenu() {
	const [selected, setSelected] = useState(sortByOptions[0]);
	const [open, setOpen] = useState(false);
	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					className="w-max bg-[#F5F5F5] px-4"
					variant="ghost"
					onClick={() => setOpen(!open)}
				>
					Sort By {selected.label}{" "}
					<ChevronUp className={cn("h-4 w-4", open && "rotate-180")} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 bg-white backdrop-blur-sm">
				<DropdownMenuCheckboxItem
					checked={selected.value === "latest"}
					onCheckedChange={() => setSelected(sortByOptions[0])}
				>
					Latest
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={selected.value === "relevance"}
					onCheckedChange={() => setSelected(sortByOptions[1])}
					disabled
				>
					Relevance
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={selected.value === "new"}
					onCheckedChange={() => setSelected(sortByOptions[2])}
				>
					New
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
