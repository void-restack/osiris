"use client";

import { Command as CommandPrimitive } from "cmdk";
import { LoaderCircle } from "lucide-react";
import * as React from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandLoading,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface AutocompleteItem {
	value: string;
	label: string;
	[key: string]: any; // Allow additional properties
}

interface AutocompleteProps<T extends AutocompleteItem> {
	onSearch: (query: string) => Promise<T[]> | T[];
	onSelect?: (item: T) => void;
	placeholder?: string;
	className?: string;
	loading?: boolean;
	debounceMs?: number;
	emptyText?: string;
	footerText?: string;
	renderItem?: (item: T, query: string) => React.ReactNode;
	getItemValue?: (item: T) => string;
	getItemLabel?: (item: T) => string;
	minSearchLength?: number;
	disabled?: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
}

export function Autocomplete<T extends AutocompleteItem>({
	onSearch,
	onSelect,
	placeholder = "Search...",
	className,
	loading = false,
	debounceMs = 300,
	emptyText = "No results found.",
	footerText,
	renderItem,
	getItemValue = (item) => item.value,
	getItemLabel = (item) => item.label,
	minSearchLength = 1,
	disabled = false,
	value: controlledValue,
	onValueChange,
}: AutocompleteProps<T>) {
	const [open, setOpen] = React.useState(false);
	const [internalLoading, setInternalLoading] = React.useState(false);
	const [items, setItems] = React.useState<T[]>([]);
	const [search, setSearch] = React.useState(controlledValue || "");
	const debouncedSearch = useDebounce(search, debounceMs);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const isLoading = loading || internalLoading;

	// Sync with controlled value
	React.useEffect(() => {
		if (controlledValue !== undefined && controlledValue !== search) {
			setSearch(controlledValue);
		}
	}, [controlledValue]);

	// Handle search
	React.useEffect(() => {
		if (debouncedSearch && debouncedSearch.length >= minSearchLength) {
			setInternalLoading(true);

			const performSearch = async () => {
				try {
					const results = await onSearch(debouncedSearch);
					setItems(Array.isArray(results) ? results : []);
				} catch (error) {
					console.error("Search error:", error);
					setItems([]);
				} finally {
					setInternalLoading(false);
				}
			};

			performSearch();
		} else {
			setItems([]);
			setInternalLoading(false);
		}
	}, [debouncedSearch, onSearch, minSearchLength]);

	function handleValueChange(newValue: string) {
		setSearch(newValue);
		onValueChange?.(newValue);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Escape") {
			inputRef.current?.blur();
			setOpen(false);
		}
	}

	function handleSelect(selectedValue: string) {
		const selectedItem = items.find(
			(item) => getItemValue(item) === selectedValue,
		);
		if (selectedItem) {
			const label = getItemLabel(selectedItem);
			handleValueChange(label);
			setOpen(false);
			inputRef.current?.blur();
			onSelect?.(selectedItem);
		}
	}

	const defaultRenderItem = (item: T, query: string) => {
		const label = getItemLabel(item);
		return (
			<div className="flex flex-col">
				<span>{getHighlightedText(label, query)}</span>
			</div>
		);
	};

	const shouldShowResults =
		open && debouncedSearch && debouncedSearch.length >= minSearchLength;

	return (
		<Command shouldFilter={false} className="overflow-visible">
			<CommandPrimitive.Input
				ref={inputRef}
				placeholder={placeholder}
				value={search}
				onInput={(e) => handleValueChange(e.currentTarget.value)}
				onKeyDown={handleKeyDown}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				disabled={disabled}
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					"placeholder:font-light",
					className,
				)}
			/>
			<div className="relative">
				{shouldShowResults && (
					<CommandList className="absolute top-1.5 z-50 w-full rounded-md border border-border bg-background">
						{isLoading ? (
							<CommandLoading>
								<LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
							</CommandLoading>
						) : (
							<>
								<CommandEmpty>{emptyText}</CommandEmpty>
								<CommandGroup>
									{items.map((item, i) => (
										<CommandItem
											key={`${getItemValue(item)}-${i}`}
											value={getItemValue(item)}
											onSelect={handleSelect}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											className="cursor-pointer"
										>
											{renderItem
												? renderItem(item, debouncedSearch)
												: defaultRenderItem(item, debouncedSearch)}
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
						{footerText && (
							<div className="border-border border-t bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
								<p>{footerText}</p>
							</div>
						)}
					</CommandList>
				)}
			</div>
		</Command>
	);
}

function getHighlightedText(text: string, query: string) {
	if (!query) return text;

	// Escape special characters in the query for regex
	const escapedQuery = query
		.split(" ")
		.filter((word) => word.length > 0)
		.map((word) => word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

	if (escapedQuery.length === 0) return text;

	// Create a regex pattern to match the query words
	const regex = new RegExp(`(${escapedQuery.join("|")})`, "gi");

	// Replace matching words with a span element for highlighting
	return text.split(regex).map((part, index) =>
		regex.test(part) ? (
			<span key={index} className="font-semibold">
				{part}
			</span>
		) : (
			<React.Fragment key={index}>{part}</React.Fragment>
		),
	);
}
