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
	description: string;
	icon: string;
	scopes: string[];
	scopeDefinitions: Record<string, string>;
	metadata: Record<string, any>;
}

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
					<div>
						<p className="font-medium text-primary-800">{row.original.name.charAt(0).toUpperCase() + row.original.name.slice(1)}</p>
						{row.original.description && (
							<p className="text-sm text-primary-500 max-w-md truncate">{row.original.description}</p>
						)}
					</div>
				</div>
			);
		},
	},
	// {
	// 	accessorKey: "scopes",
	// 	header: "Required Scopes",
	// 	cell: ({ row }) => (
	// 		<div className="flex flex-wrap gap-2">
	// 			{row.original.scopes.map((scope) => {
	// 				const scopeDefinition = row.original.scopeDefinitions[scope];
	// 				return (
	// 					<div
	// 						className="h-6 rounded-[4px] bg-primary-50 px-2 py-0.5 text-primary-400 text-xs"
	// 						key={scope}
	// 						title={scopeDefinition || scope}
	// 					>
	// 						{scopeDefinition || scope}
	// 					</div>
	// 				);
	// 			})}
	// 		</div>
	// 	),
	// },
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
