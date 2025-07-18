import { create } from "zustand";
import { persist } from "zustand/middleware";

export type McpViewType = "list" | "directory";
export type KnowledgeBaseViewType = "list" | "directory";

export type Database = {
	id: number;
	name: string;
	host: string;
	lastActivity: string;
	status: "Active" | "Idle" | "Error";
};

interface AppState {
	mcpView: McpViewType;
	setMcpView: (view: McpViewType) => void;
	knowledgeBaseView: KnowledgeBaseViewType;
	setKnowledgeBaseView: (view: KnowledgeBaseViewType) => void;

	// Edit sidebar state
	selectedDatabase: Database | null;
	isEditSidebarOpen: boolean;

	// Edit sidebar actions
	openEditSidebar: (database: Database) => void;
	closeEditSidebar: () => void;
	updateSelectedDatabase: (database: Database) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			mcpView: "list",
			setMcpView: (view) => set({ mcpView: view }),
			knowledgeBaseView: "directory",
			setKnowledgeBaseView: (view) => set({ knowledgeBaseView: view }),

			// Edit sidebar initial state
			selectedDatabase: null,
			isEditSidebarOpen: false,

			// Edit sidebar actions
			openEditSidebar: (database) =>
				set({ selectedDatabase: database, isEditSidebarOpen: true }),
			closeEditSidebar: () =>
				set({ selectedDatabase: null, isEditSidebarOpen: false }),
			updateSelectedDatabase: (database) => set({ selectedDatabase: database }),
		}),
		{
			name: "osiris-app-store",
			partialize: (state) => ({
				mcpView: state.mcpView,
				knowledgeBaseView: state.knowledgeBaseView,
			}),
		},
	),
);
