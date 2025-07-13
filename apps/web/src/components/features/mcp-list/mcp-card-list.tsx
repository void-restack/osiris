import { McpCard, type McpCardProps } from "./mcp-card";

export function McpCardList({ cards }: { cards: McpCardProps[] }) {
	return (
		<div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{cards.map((card) => (
				<McpCard key={card.title} {...card} />
			))}
		</div>
	);
}
