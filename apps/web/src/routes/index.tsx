import { McpSearchBox } from "@/components/features/mcp-search/mcp-search-box";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return <div>
		<McpSearchBox />
	</div>;
}
