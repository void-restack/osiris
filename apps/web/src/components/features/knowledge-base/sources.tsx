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
import {
	ChevronDown,
	ChevronUp,
	File,
	FileDown,
	FileText,
	Link,
	PencilLine,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";

type sourceType = "text" | "pdf" | "md" | "link";

type Source = {
	id: number;
	name: string;
	type: sourceType;
	unitsCount: number;
};

const IconConfig = {
	text: FileText,
	pdf: File,
	md: FileDown,
	link: Link,
} as const;

const data: Source[] = [
	{
		name: "Onboarding Contract.doc",
		type: "link",
		id: 1,
		unitsCount: 12,
	},
	{
		name: "www.globaldata.com",
		type: "link",
		id: 1,
		unitsCount: 12,
	},
];

export const columns: ColumnDef<Source>[] = [
	{
		accessorKey: "id",
		header: ({ column }) => {
			return (
				<button
					type="button"
					className="w-[42px] pr-3 text-right font-medium text-sm flex items-center gap-1"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					#
					{column.getIsSorted() === "asc" && <span>▲</span>}
					{column.getIsSorted() === "desc" && <span>▼</span>}
				</button>
			);
		},
		enableSorting: true,
		cell: ({ row }) => (
			<div className="text-right font-medium text-[#737373] text-sm">
				{row.index + 1}
			</div>
		),
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<button
				type="button"
				className="font-normal text-primary-400 text-sm flex items-center gap-1"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Knowledge Source Name
				{column.getIsSorted() === "asc" && <span>
					<ChevronUp className="text-xs" /></span>}
				{column.getIsSorted() === "desc" && <span>
					<ChevronDown className="text-xs" /></span>}
			</button>
		),
		enableSorting: true,
		cell: ({ row }) => (
			<div className="w-[500px] text-[#171717] text-sm capitalize">
				{row.getValue("name")}
			</div>
		),
	},
	{
		accessorKey: "unitsCount",
		header: ({ column }) => (
			<button
				type="button"
				className="font-normal text-primary-400 text-sm flex items-center gap-1"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Units
				{column.getIsSorted() === "asc" && <span>▲</span>}
				{column.getIsSorted() === "desc" && <span>▼</span>}
			</button>
		),
		enableSorting: true,
		cell: ({ row }) => (
			<div className="">{row.getValue("unitsCount")} Units</div>
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => (
			<button
				type="button"
				className="font-normal text-primary-400 text-sm flex items-center gap-1"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Content Type
				{column.getIsSorted() === "asc" && <span>▲</span>}
				{column.getIsSorted() === "desc" && <span>▼</span>}
			</button>
		),
		enableSorting: true,
		cell: ({ row }) => (
			<div className="flex h-6 w-max items-center gap-1.5 rounded-[6px] bg-[#1717170F] px-2 py-1.5 text-[#171717CC] text-sm">
				{React.createElement(
					IconConfig[row.getValue("type") as keyof typeof IconConfig],
					{ className: "w-2.5 h-2.5" },
				)}
				{row.getValue("type")}
			</div>
		),
	},
	{
		accessorKey: "#",
		header: () => {
			<p className="" />;
		},
		enableSorting: false,
		cell: () => {
			return (
				<div className="flex justify-end">
					<Button
						className="h-6 w-6 rounded-[6px] border border-primary-100 bg-transparent"
						variant={"ghost"}
					>
						<PencilLine className="stroke-primary-300" width={14} height={14} />
					</Button>
				</div>
			);
		},
	},
];

export function SourcesTable() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	// Pagination state
	const [currentPage, setCurrentPage] = React.useState(1);
	const pageSize = 10;
	const totalResults = data.length;
	const totalPages = Math.ceil(totalResults / pageSize);
	const paginatedData = React.useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return data.slice(start, start + pageSize);
	}, [currentPage, pageSize]);

	const table = useReactTable({
		data: paginatedData,
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
										className={`bg-primary-25 font-normal text-primary-400 text-sm ${index === 0 ? "pr-0" : index === 1 ? "pl-0" : ""}`}
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
								className="hover:bg-primary-25"
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell, index) => (
									<TableCell
										className={`h-14 ${index === 0 || index === 4 ? "w-[42px] pr-3" : index === 1 ? "pl-0" : ""}`}
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
			<McpListPagination
				totalPages={totalPages}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
				totalResults={totalResults}
			/>
		</div>
	);
}
