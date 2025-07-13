import { create } from "zustand";
import { persist } from "zustand/middleware";

export type McpViewType = "list" | "directory";
export type KnowledgeBaseViewType = "list" | "directory";

interface AppState {
	mcpView: McpViewType;
	setMcpView: (view: McpViewType) => void;
	knowledgeBaseView: KnowledgeBaseViewType;
	setKnowledgeBaseView: (view: KnowledgeBaseViewType) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			mcpView: "list",
			setMcpView: (view) => set({ mcpView: view }),
			knowledgeBaseView: "directory",
			setKnowledgeBaseView: (view) => set({ knowledgeBaseView: view }),
		}),
		{
			name: "osiris-app-store",
		},
	),
);
