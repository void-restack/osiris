import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function McpListPagination({
	totalPages,
	currentPage,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: <future use>
	onPageChange,
	resultsPerPage,
	totalResults,
}: {
	totalPages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	resultsPerPage: number;
	totalResults: number;
}) {
	return (
		<div className="flex h-12 w-full items-center justify-between border-t px-6 text-[#A3A3A3]">
			<div>
				<p>{totalResults} results</p>
			</div>
			<div className="flex items-center gap-1 text-sm">
				<Button variant={"ghost"} size={"icon"} className="cursor-pointer">
					<ChevronLeft />
				</Button>
				<span>
					{currentPage} - {resultsPerPage} of {totalPages}
				</span>
				<Button variant={"ghost"} size={"icon"} className="cursor-pointer">
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}
