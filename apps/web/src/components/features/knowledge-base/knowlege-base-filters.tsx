"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

export type KnowledgeBaseFiltersProps = {
	tags: string[];
	selectedTag: string;
	onTagChange: (tag: string) => void;
	permission: string;
	onPermissionChange: (permission: string) => void;
	sortBy: string;
	onSortByChange: (sort: string) => void;
};

const sortOptions = [
	{ label: "Latest", value: "latest" },
	{ label: "Stars", value: "stars" },
	{ label: "Credits", value: "credits" },
];

const permissionOptions = [
	{ label: "All", value: "all" },
	{ label: "Public", value: "public" },
	{ label: "Private", value: "private" },
];

export function KnowledgeBaseFilters({
	tags,
	selectedTag,
	onTagChange,
	permission,
	onPermissionChange,
	sortBy,
	onSortByChange,
}: KnowledgeBaseFiltersProps) {
	return (
		<div className="flex w-full items-center gap-2">
			<SortByMenu sortBy={sortBy} onSortByChange={onSortByChange} />
		</div>
	);
}

// function TagMenu({ tags, selectedTag, onTagChange }: { tags: string[]; selectedTag: string; onTagChange: (tag: string) => void }) {
// 	return (
// 		<DropdownMenu>
// 			<DropdownMenuTrigger asChild>
// 				<Button variant="outline" size="sm" className="gap-2">
// 					Tag: {selectedTag === "all" ? "All" : selectedTag}
// 					<ChevronDown className="size-4" />
// 				</Button>
// 			</DropdownMenuTrigger>
// 			<DropdownMenuContent align="end">
// 				<DropdownMenuItem onClick={() => onTagChange("all")}>All</DropdownMenuItem>
// 				{tags.map((tag) => (
// 					<DropdownMenuItem key={tag} onClick={() => onTagChange(tag)}>
// 						{tag}
// 					</DropdownMenuItem>
// 				))}
// 			</DropdownMenuContent>
// 		</DropdownMenu>
// 	);
// }

// function PermissionMenu({ permission, onPermissionChange }: { permission: string; onPermissionChange: (permission: string) => void }) {
// 	return (
// 		<DropdownMenu>
// 			<DropdownMenuTrigger asChild>
// 				<Button variant="outline" size="sm" className="gap-2">
// 					Permission: {permissionOptions.find(opt => opt.value === permission)?.label}
// 					<ChevronDown className="size-4" />
// 				</Button>
// 			</DropdownMenuTrigger>
// 			<DropdownMenuContent align="end">
// 				{permissionOptions.map((option) => (
// 					<DropdownMenuItem key={option.value} onClick={() => onPermissionChange(option.value)}>
// 						{option.label}
// 					</DropdownMenuItem>
// 				))}
// 			</DropdownMenuContent>
// 		</DropdownMenu>
// 	);
// }

function SortByMenu({ sortBy, onSortByChange }: { sortBy: string; onSortByChange: (sort: string) => void }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}
					<ChevronDown className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{sortOptions.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => onSortByChange(option.value)}
						className="pl-2"
					>
						<span className="flex items-center gap-2">
							<Checkbox checked={sortBy === option.value} className="pointer-events-none" />
							{option.label}
						</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
