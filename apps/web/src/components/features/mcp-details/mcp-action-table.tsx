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
import { MoveUpRight } from "lucide-react";
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

type actionStatus = "Pending" | "Failed" | "Success";

type McpAction = {
	name: string;
	status: actionStatus;
	timestamp: Date;
	id: number;
};

const data: McpAction[] = [
	{
		name: "Analysing and syncing contacts",
		id: 1,
		status: "Pending",
		timestamp: new Date(),
	},
	{
		name: "Send an Email",
		id: 2,
		status: "Failed",
		timestamp: new Date(),
	},
	{
		name: "Draft an Email",
		id: 4,
		status: "Success",
		timestamp: new Date(),
	},
];

export type Payment = {
	id: string;
	amount: number;
	status: "pending" | "processing" | "success" | "failed";
	email: string;
};

export const columns: ColumnDef<McpAction>[] = [
	{
		accessorKey: "id",
		header: () => {
			return (
				<h1 className="w-[42px] pr-3 text-right font-medium text-sm">#</h1>
			);
		},
		cell: ({ row }) => (
			<div className="text-right font-medium text-[#737373] text-sm">
				{row.index + 1}
			</div>
		),
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => (
			<div className="text-[#171717] text-sm capitalize">
				{row.getValue("name")}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: () => {
			return <p className="text-right">Status</p>;
		},
		cell: ({ row }) => (
			<div className="flex justify-end">
				<div
					className={cn(
						"h-6 w-max rounded-[4px] px-2 py-0.5 text-xs",
						row.getValue("status") === "Pending"
							? "bg-primary-50 text-primary-400"
							: row.getValue("status") === "Failed"
								? "bg-[#F03D3D1A] text-[#F03D3D]"
								: "bg-success-100 text-[#2DCA04]",
					)}
				>
					{row.getValue("status")}
				</div>
			</div>
		),
	},
	{
		accessorKey: "timestamp",
		header: () => {
			return <p className="text-right">Timestamp</p>;
		},
		cell: ({ row }) => (
			<div className="text-right lowercase">
				{(row.getValue("timestamp") as Date).toLocaleString()}
			</div>
		),
	},
	{
		accessorKey: "#",
		header: () => {
			<p className="" />;
		},
		cell: () => {
			return (
				<div className="flex w-[56px] justify-end">
					<Button
						className="h-6 w-5 rounded-none bg-[#F5F5F5] hover:bg-[#F5F5F5]"
						variant={"ghost"}
					>
						<MoveUpRight width={14} height={14} />
					</Button>
				</div>
			);
		},
	},
];

interface McpActionTableProps {
	data?: Array<{
		name: string;
		description?: string;
		method?: string;
		path?: string;
		service?: string;
	}>;
}

export function McpActionTable({ data = [] }: McpActionTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	// Transform API data to match the table structure
	const transformedData: McpAction[] = data.map((action, index) => ({
		name: action.name,
		id: index + 1,
		status: "Success" as actionStatus, // Default status
		timestamp: new Date(),
	}));

	const table = useReactTable({
		data: transformedData,
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
										className={`font-medium text-[#737373] text-sm ${index === 0 ? "pr-0" : index === 1 ? "pl-0" : ""}`}
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
		</div>
	);
}
