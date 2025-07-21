import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "./mermaid";
import { CreateClientVideo } from "./components/docs/create-client-video";
import { ConnectAuthVideo } from "./components/docs/connect-auth-video";
import { ConnectMcpAuthVideo } from "./components/docs/connect-mcp-auth-video";
// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		Mermaid,
		CreateClientVideo,
		ConnectAuthVideo,
		ConnectMcpAuthVideo,
		...components,
	};
}
