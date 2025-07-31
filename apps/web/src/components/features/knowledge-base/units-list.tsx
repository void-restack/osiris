import { useState, useMemo } from "react";
import { UnitsCard } from "./units-card";
import type { UnitsCardProps } from "./units-card";
import { McpListPagination } from "../mcp-list/mcp-list-pagination";

const mockUnitsData: UnitsCardProps[] = [
  {
    title: "Unit 1",
    description: "Description for unit 1",
    oneLiner: "One liner for unit 1",
  },
  {
    title: "Unit 2",
    description: "Description for unit 2",
    oneLiner: "One liner for unit 2",
  },
  {
    title: "Unit 3",
    description: "Description for unit 3",
    oneLiner: "One liner for unit 3",
  },
  {
    title: "Unit 4",
    description: "Description for unit 4",
    oneLiner: "One liner for unit 4",
  },
  {
    title: "Unit 5",
    description: "Description for unit 5",
    oneLiner: "One liner for unit 5",
  },
  {
    title: "Unit 6",
    description: "Description for unit 6",
    oneLiner: "One liner for unit 6",
  },
  {
    title: "Unit 7",
    description: "Description for unit 7",
    oneLiner: "One liner for unit 7",
  },
  {
    title: "Unit 8",
    description: "Description for unit 8",
    oneLiner: "One liner for unit 8",
  },
  {
    title: "Unit 9",
    description: "Description for unit 9",
    oneLiner: "One liner for unit 9",
  },
  {
    title: "Unit 10",
    description: "Description for unit 10",
    oneLiner: "One liner for unit 10",
  },
];

export function UnitsCardsList() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const totalResults = mockUnitsData.length;
  const totalPages = Math.ceil(totalResults / pageSize);

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return mockUnitsData.slice(start, start + pageSize);
  }, [currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {paginatedUnits.map((unit, idx) => (
          <UnitsCard key={unit.title + idx} {...unit} />
        ))}
      </div>

      <div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 py-6 z-50">
        <McpListPagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalResults={totalResults}
        />
      </div>
    </div>
  );
}
