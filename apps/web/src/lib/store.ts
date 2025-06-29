import { create } from "zustand";
import { persist } from "zustand/middleware";

export type McpViewType = "list" | "directory";

interface AppState {
	mcpView: McpViewType;
	setMcpView: (view: McpViewType) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			// MCP View Toggle State
			mcpView: "list",
			setMcpView: (view) => set({ mcpView: view }),
		}),
		{
			name: "osiris-app-store",
		},
	),
);
