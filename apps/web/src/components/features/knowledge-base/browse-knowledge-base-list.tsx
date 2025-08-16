import type { KnowledgeBase } from "@/types";
import { KnowledgeBaseCard } from "./knowledge-base-card";
import type { Row } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BrowseKnowledgeBaseListProps {
  rows: Row<KnowledgeBase>[];
}
export function BrowseKnowledgeBaseList({
  rows,
}: BrowseKnowledgeBaseListProps) {
  return (
    <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto hidebar px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-2 pb-8 hidebar gap-4">
        {rows.map((row) => (
          <KnowledgeBaseCard
            key={row.original.knowledgeBaseId}
            {...row.original}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export const KnowledgeBaseGridViewColumns: any[] = [
  {
    id: "name",
    accessorKey: "name",
    enableColumnFilter: false,
    header: () => null,
    cell: () => null,

    meta: {
      variant: "text",
      label: "Knowledge Base name",
      placeholder: "search knowledge base",
    },
  },
  {
    id: "price",
    accessorFn: (row: any) => row.publicMetadata?.price || 0,
    enableColumnFilter: true,
    header: () => null,
    cell: () => null,
    meta: {
      variant: "range",
      label: "Price",
      min: 0,
      max: 100,
      step: 1,
      value: [0, 100],
    },
  },
];
