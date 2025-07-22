import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "./mermaid";
import { CreateMCPVideo } from "./components/docs/create-client-video";
import { ConnectAuthVideo } from "./components/docs/connect-auth-video";
import { ConnectMcpAuthVideo } from "./components/docs/connect-mcp-auth-video";
// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		Mermaid,
		CreateMCPVideo,
		ConnectAuthVideo,
		ConnectMcpAuthVideo,
		...components,
	};
}
