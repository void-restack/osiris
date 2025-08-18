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
import { Mail, MoveUpRight, Reply, Send } from "lucide-react";
import * as React from "react";
import { ICONS } from "@/components/icons";
import { McpTag } from "@/components/tag";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface Capability {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	inputSchema?: any; // MCP tool input schema
}

export const capabilities: Capability[] = [
	{
		id: "draft_email",
		title: "Draft an Email",
		description: "Draft an Email to recipients that can be scheduled",
		icon: Mail,
	},
	{
		id: "send_message",
		title: "Send an Email",
		description: "Draft an Email to recipients that can...",
		icon: Send,
	},
	{
		id: "reply_to_emails",
		title: "Reply to Emails",
		description:
			"Reply to an Email to recipients that can be scheduled to be sent at a later date",
		icon: Reply,
	},
	{
		id: "draft_email",
		title: "Draft an Email",
		description:
			"Draft an Email to recipients that can be scheduled to be sent at a later date",
		icon: Mail,
	},
	{
		id: "draft_email",
		title: "Draft an Email",
		description:
			"Draft an Email to recipients that can be scheduled to be sent at a later date",
		icon: Mail,
	},
];

export const columns: ColumnDef<Capability>[] = [
	{
		accessorKey: "id",
		header: () => {
			return (
				<div className="flex items-center gap-2">
					<ICONS.cap />
					<p>MCP Capabilities</p>
					{/* Show indicator if using real MCP tools */}
					{/* This header cannot access 'data' directly. Move this logic to the parent component and pass a prop if needed. */}
				</div>
			);
		},
		cell: ({ row }) => {
			return (
				<div className="flex items-center gap-4 max-w-sm">
					<div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary-50">
						<row.original.icon className="h-4 w-4 stroke-primary-400" />
					</div>
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<h1 className="font-medium text-primary-800 text-sm">
								{row.original.title}
							</h1>
							{row.original.inputSchema && (
								<span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
									MCP
								</span>
							)}
						</div>
						<p className="text-primary-300 text-xs max-w-xs truncate">
							{row.original.description}
						</p>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "name",
		header: "",
		cell: ({ row }) => (
			<div className="flex items-center justify-end gap-3 px-8">
				<McpTag tag={row.original.id} />
				<Button variant="secondary" className="h-6 w-5 rounded shadow-none">
					<MoveUpRight className="h-[14px] w-[14px] bg-primary-50 stroke-primary-400" />
				</Button>
			</div>
		),
	},
];

export function McpCapabilitiesList({ data }: { data: Capability[] }) {
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
		<div className="rounded-md relative border border-primary-50 h-[400px] overflow-hidden">
			<div className="h-full overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-white z-10">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow className="" key={headerGroup.id}>
								{headerGroup.headers.map((header, _index) => {
									return (
										<TableHead key={header.id}>
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
						{data?.length ? (
							data.map((item, index) => {
								const row = table.getRowModel().rows[index] || {
									id: item.id,
									original: item,
									getIsSelected: () => false,
									getVisibleCells: () => columns.map((col, cellIndex) => ({
										id: `${item.id}-${cellIndex}`,
										column: { columnDef: col },
										getContext: () => ({ row: { original: item } })
									}))
								};
								return (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected && row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell, _index) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									<div className="flex flex-col items-center gap-2">
										<p className="text-primary-600 font-medium">No tools available</p>
										<p className="text-primary-400 text-sm">This MCP server doesn't provide any tools</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
