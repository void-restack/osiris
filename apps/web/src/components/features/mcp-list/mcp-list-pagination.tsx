import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function McpListPagination({
  totalPages,
  currentPage,
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
    <div className="flex justify-between items-center w-full absolute bottom-0 border-t px-6 h-12 text-[#A3A3A3]">
      <div>
        <p>{totalResults} results</p>
      </div>
      <div className="flex items-center text-sm gap-1">
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
