import type { KnowledgeBase } from "@/types";
import { KnowledgeBaseCard } from "./knowledge-base-card";
export function BrowseKnowledgeBaseList({ cards }: { cards: KnowledgeBase[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <KnowledgeBaseCard key={card.knowledgeBaseId} {...card} />
      ))}
    </div>
  );
}
