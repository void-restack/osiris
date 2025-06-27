import { McpCard, type McpCardProps } from "./mcp-card";

export function McpCardList({ cards }: { cards: McpCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <McpCard key={card.title} {...card} />
      ))}
    </div>
  );
}