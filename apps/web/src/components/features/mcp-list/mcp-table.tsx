"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { BadgeCheck, Eye } from "lucide-react";
import * as React from "react";
import { ICONS } from "@/components/icons";
import { McpTag, type McpTagProps } from "@/components/tag";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { McpCardProps } from "./mcp-card";
import { McpListPagination } from "./mcp-list-pagination";

interface McpTableRow extends McpCardProps {
	credits?: number | "FREE";
}

export const columns: ColumnDef<McpTableRow>[] = [
	{
		accessorKey: "id",
		header: () => (
			<h1 className="w-[42px] pr-3 text-right font-medium text-sm">#</h1>
		),
		cell: ({ row }) => (
			<div className="text-right font-medium text-[#737373] text-sm">
				{row.index + 1}
			</div>
		),
	},
	{
		accessorKey: "title",
		header: "Name",
		cell: ({ row }) => (
			<div className="flex min-w-[220px] items-center gap-3">
				<img
					src={row.original.icon}
					alt={row.getValue("title") as string}
					className="h-8 w-8 rounded-md border object-cover"
				/>
				<div>
					<div className="flex items-center gap-1">
						<span className="font-medium text-[#171717] text-sm">
							{row.getValue("title")}
						</span>
						{row.original.isVerified && (
							<ICONS.verifiedBadge className="h-4 w-4 text-green-500" />
						)}
					</div>
					<div className="text-[#737373] text-xs">
						{row.original.userHandle}
					</div>
				</div>
			</div>
		),
	},
	{
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => (
			<div className="max-w-md truncate text-[#737373] text-sm">
				{row.getValue("description")}
			</div>
		),
	},
	{
		accessorKey: "tags",
		header: "Type",
		cell: ({ row }) => {
			const tags = row.getValue("tags") as McpTagProps[];
			return (
				<div className="flex gap-1">
					{tags.slice(0, 2).map((tag, index) => (
						<McpTag key={index} tag={tag.tag} />
					))}
				</div>
			);
		},
	},
	{
		accessorKey: "credits",
		header: "Credits",
		cell: ({ row }) => {
			const credits = row.original.credits;
			if (credits === "FREE") {
				return (
					<span className="rounded bg-[#F5F5F5] px-3 py-1 font-semibold text-[#737373] text-xs">
						FREE
					</span>
				);
			}
			return (
				<span className="flex w-max items-center gap-1 rounded bg-green-100 px-3 py-1 font-semibold text-[#2DCA04] text-xs">
					<Eye className="h-4 w-4 text-green-500" />
					{credits}
				</span>
			);
		},
	},
];

interface McpTableProps {
	data: McpTableRow[];
}

export function McpTable({ data }: McpTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<div className="rounded-md border border-[#F5F5F5]">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow className="" key={headerGroup.id}>
							{headerGroup.headers.map((header, index) => {
								return (
									<TableHead
										className={`bg-[#FAFAFA] font-medium text-[#737373] text-sm ${index === 0 ? "pr-0" : index === 1 ? "pl-0" : ""}`}
										key={header.id}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
								className="cursor-pointer hover:bg-gray-50"
							>
								{row.getVisibleCells().map((cell, index) => (
									<TableCell
										className={`h-14 ${index === 0 ? "w-[42px] pr-3" : index === 1 ? "pl-0" : ""}`}
										key={cell.id}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
