import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth-optimized";

import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { useState } from "react";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum([ "price", "rating", "credits", "installs", "recent"]).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  isPublic: z.boolean().optional(),
  startPrice: z.number().optional(),
  endPrice: z.number().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  topK: z.coerce.number().optional(),
  showOnlyMyKBs: z.coerce.boolean().optional(),
  showInstalled: z.coerce.boolean().optional(),
});



export const Route = createFileRoute("/_hub/knowledge/")({
  shouldReload: false,
  component: () => (
      <RouteComponent />
  ),
  validateSearch: searchSchema,
  beforeLoad: () => {
    const authenticated = isAuthenticated();
    return { authenticated };
  },
  loader: async () => {
    // No need to fetch data here anymore - it's handled by the list container
    return { breadcrumb: "Knowledge Bases" };
  },
});

function RouteComponent() {
  const [knowledgeBaseTable, setKnowledgeBaseTable] = useState<any>(null);
  return (
    <div className="flex flex-1 flex-col pt-4 relative">
      <KnowledgeBaseListContainer setKnowledgeBaseTable={setKnowledgeBaseTable} />
      {knowledgeBaseTable && <DataTablePagination className="absolute -bottom-2 z-20 left-0 right-0 bg-primary-100" table={knowledgeBaseTable} />}
    </div>
  );
}
