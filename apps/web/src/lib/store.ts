import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserServiceConnection, type ServiceClient } from "@/types/auth";

export type McpViewType = "list" | "directory";
export type KnowledgeBaseViewType = "list" | "directory";

interface AppState {
  mcpView: McpViewType;
  setMcpView: (view: McpViewType) => void;
  knowledgeBaseView: KnowledgeBaseViewType;
  setKnowledgeBaseView: (view: KnowledgeBaseViewType) => void;

  selectedConnection: UserServiceConnection | null;
  selectedServiceClient: ServiceClient | null;
  isEditSidebarOpen: boolean;

  openEditSidebar: (
    connection: UserServiceConnection,
    serviceClient?: ServiceClient,
  ) => void;
  closeEditSidebar: () => void;
  updateSelectedConnection: (connection: UserServiceConnection) => void;
  setSidebarOpen?: (open: boolean) => void;
  setSidebarOpenCallback: (callback: (open: boolean) => void) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      mcpView: "list",
      setMcpView: (view) => set({ mcpView: view }),
      knowledgeBaseView: "directory",
      setKnowledgeBaseView: (view) => set({ knowledgeBaseView: view }),

      selectedConnection: null,
      selectedServiceClient: null,
      isEditSidebarOpen: false,

      openEditSidebar: (connection, serviceClient) => {
        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
        set({
          selectedConnection: connection,
          selectedServiceClient:
            serviceClient || connection.serviceClient || null,
          isEditSidebarOpen: true,
        });
      },
      closeEditSidebar: () =>
        set({
          selectedConnection: null,
          selectedServiceClient: null,
          isEditSidebarOpen: false,
        }),
      updateSelectedConnection: (connection) =>
        set({ selectedConnection: connection }),
      setSidebarOpenCallback: (callback) => set({ setSidebarOpen: callback }),
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
