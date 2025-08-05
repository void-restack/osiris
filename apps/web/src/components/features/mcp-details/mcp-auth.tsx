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
import * as React from "react";
import { ICONS } from "@/components/icons";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Authenticator {
	id: string;
	name: string;
	icon: string;
	scopes: string[];
}

export const authenticators: Authenticator[] = [
	{
		id: "gmail",
		name: "Gmail",
		icon: "/test/gmail.svg",
		scopes: ["Read", "Write", "Send"],
	},
	{
		id: "calendar",
		name: "Calendar",
		icon: "/test/calander.svg",
		scopes: ["Read", "Write", "Send"],
	},
	{
		id: "contact",
		name: "Contact",
		icon: "/test/contact.svg",
		scopes: ["Read", "Write", "Send"],
	},
];

export const columns: ColumnDef<Authenticator>[] = [
	{
		accessorKey: "id",
		header: () => {
			return (
				<div className="flex items-center gap-2">
					<ICONS.auth />
					<p>MCP requires these Authenticators.</p>
				</div>
			);
		},
		cell: ({ row }) => {
			return (
				<div className="flex items-center gap-3">
					<div className="h-9 w-9">
						<Avatar>
							<AvatarImage
								src={row.original.icon}
								alt={row.original.name}
								width={36}
								height={36}
							/>
							<AvatarFallback>
								{row.original.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
					<p className="font-medium text-primary-800">{row.original.name}</p>
				</div>
			);
		},
	},
	{
		accessorKey: "scopes",
		header: "",
		cell: ({ row }) => (
			<div className="flex items-center justify-end gap-3 px-8">
				{row.original.scopes.map((scope) => (
					<div
						className="h-6 rounded-[4px] bg-primary-50 px-2 py-0.5 text-primary-400 text-xs"
						key={scope}
					>
						{scope}
					</div>
				))}
			</div>
		),
	},
];

export function McpAuthList({ data }: { data: Authenticator[] }) {
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
		<div className="rounded-md border border-primary-50">
			<Table>
				<TableHeader>
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
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell, _index) => (
									<TableCell key={cell.id}>
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
