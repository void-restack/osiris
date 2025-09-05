import { Command as CommandPrimitive } from "cmdk";
import { LoaderCircle, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
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
	onSearch: (query: string) => T[] | Promise<T[]>;
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
	showSearchButton?: boolean;
	onSearchButtonClick?: () => void;
	bottomLeftContent?: React.ReactNode;
	bottomRightContent?: React.ReactNode;
	popularItems?: React.ReactNode;
}

export function Autocomplete<T extends AutocompleteItem>({
	onSearch,
	onSelect,
	placeholder = "Search...",
	className,
	loading = false,
	debounceMs = 300,
	emptyText = "No results found.",
	renderItem,
	getItemValue = (item) => item.value,
	getItemLabel = (item) => item.label,
	minSearchLength = 1,
	disabled = false,
	value: controlledValue,
	onValueChange,
	showSearchButton = true,
	onSearchButtonClick,
	bottomLeftContent,
	bottomRightContent,
	popularItems,
}: AutocompleteProps<T>) {
	const [open, setOpen] = React.useState(false);
	const [internalLoading, setInternalLoading] = React.useState(false);
	const [items, setItems] = React.useState<T[]>([]);
	const [search, setSearch] = React.useState(controlledValue || "");
	const [isFocused, setIsFocused] = React.useState(false);
	const debouncedSearch = useDebounce(search, debounceMs);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const isLoading = loading || internalLoading;

	React.useEffect(() => {
		if (controlledValue !== undefined && controlledValue !== search) {
			setSearch(controlledValue);
		}
	}, [controlledValue]);

	React.useEffect(() => {
		if (debouncedSearch && debouncedSearch.length >= minSearchLength) {
			setInternalLoading(true);

			const performSearch = async () => {
				try {
					const results = await onSearch(debouncedSearch);
					setItems(Array.isArray(results) ? results : []);
				} catch (error) {

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
		if (event.key === "Enter" && showSearchButton) {
			event.preventDefault();
			onSearchButtonClick?.();
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
			<div className="flex items-center space-x-2">
				<div className="size-4 rounded-md bg-purple-400" />
				<span>{getHighlightedText(label, query)}</span>
				<span> - </span>
				<span className="text-primary-400">oauth descriptions</span>
			</div>
		);
	};

	const shouldShowResults =
		open && debouncedSearch && debouncedSearch.length >= minSearchLength;

	return (
		<div
			className={cn(
				"mx-auto flex max-w-md sm:max-w-full lg:max-w-[712px] flex-col gap-3 rounded-[18px] bg-primary-25 p-3 sm:p-4 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)] relative",
				className,
			)}
			style={{ zIndex: 2 }}
		>
			<Command shouldFilter={false} className="overflow-visible">
				<div className="relative h-[56px] sm:h-[84px]">
					<CommandPrimitive.Input
						ref={inputRef}
						placeholder={placeholder}
						value={search}
						onInput={(e) => handleValueChange(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						onFocus={() => {
							setOpen(true);
							setIsFocused(true);
						}}
						onBlur={() => {
							setOpen(false);
							setIsFocused(false);
						}}
						disabled={disabled}
						className="w-full resize-none rounded-[12px] border border-none bg-primary-00 p-3 sm:p-2 pr-24 sm:pr-28 text-primary-700 placeholder:text-primary-300 focus:outline-none focus:ring-0"
					/>
					{showSearchButton && (
						<Button
							onClick={onSearchButtonClick}
							onMouseDown={(e) => {
								e.preventDefault();
							}}
							disabled={!search.trim() || !isFocused}
							className="-translate-y-1/2 absolute inset-shadow-search-btn top-1/2 right-2 sm:right-3 h-8 px-3 sm:h-9 sm:px-4 text-sm"
						>
							<span>Search</span>
							<Search className="ml-1 h-4 w-4" />
						</Button>
					)}
				</div>

				<div className="relative">
					{shouldShowResults && (
						<div className="absolute top-1.5 left-0 right-0 z-[99999] w-full max-w-full rounded-md border border-border bg-white shadow-lg overflow-hidden max-h-[320px] sm:max-h-[420px]">
							<CommandList className="w-full">
								{popularItems ? (
									<>
										<span className="mb-2 px-3 py-2 text-[13px] text-primary-400">
											Popular
										</span>
										<div className="px-3">{popularItems}</div>
										<div className="mt-3 border-primary-100 border-t border-dashed" />
									</>
								) : null}
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
							</CommandList>
						</div>
					)}
				</div>
			</Command>

			{(bottomLeftContent || bottomRightContent) && (
				<div className="flex justify-between items-center gap-2 flex-wrap">
					<div className="flex flex-wrap gap-2">{bottomLeftContent}</div>
					<div className="flex p-0">{bottomRightContent}</div>
				</div>
			)}
		</div>
	);
}

function getHighlightedText(text: string, query: string) {
	if (!query) return text;

	const escapedQuery = query
		.split(" ")
		.filter((word) => word.length > 0)
		.map((word) => word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

	if (escapedQuery.length === 0) return text;

	const regex = new RegExp(`(${escapedQuery.join("|")})`, "gi");

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
