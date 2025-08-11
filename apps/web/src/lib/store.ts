import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserServiceConnection, type ServiceClient } from "@/types/auth";

export type McpViewType = "list" | "directory";
export type KnowledgeBaseViewType = "list" | "directory";

// Add MCP server types
export interface McpServerData {
  deploymentId: string;
  userMcpId: string;
  url: string;
  scopes: string[];
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  mcpView: McpViewType;
  setMcpView: (view: McpViewType) => void;
  knowledgeBaseView: KnowledgeBaseViewType;
  setKnowledgeBaseView: (view: KnowledgeBaseViewType) => void;

  selectedConnection: UserServiceConnection | null;
  selectedServiceClient: ServiceClient | null;
  isEditSidebarOpen: boolean;

  // Add MCP server editing state
  selectedMcpServer: McpServerData | null;
  isMcpServerEditSidebarOpen: boolean;

  openEditSidebar: (
    connection: UserServiceConnection,
    serviceClient?: ServiceClient,
  ) => void;
  closeEditSidebar: () => void;
  updateSelectedConnection: (connection: UserServiceConnection) => void;
  setSidebarOpen?: (open: boolean) => void;
  setSidebarOpenCallback: (callback: (open: boolean) => void) => void;

  // Add MCP server editing functions
  openMcpServerEditSidebar: (server: McpServerData) => void;
  closeMcpServerEditSidebar: () => void;
  updateSelectedMcpServer: (server: McpServerData) => void;
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

      // Add MCP server editing state
      selectedMcpServer: null,
      isMcpServerEditSidebarOpen: false,

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
          // Close MCP server edit sidebar when opening connection edit sidebar
          isMcpServerEditSidebarOpen: false,
          selectedMcpServer: null,
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

      // Add MCP server editing functions
      openMcpServerEditSidebar: (server) => {
        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
        set({
          selectedMcpServer: server,
          isMcpServerEditSidebarOpen: true,
          // Close connection edit sidebar when opening MCP server edit sidebar
          isEditSidebarOpen: false,
          selectedConnection: null,
          selectedServiceClient: null,
        });
      },
      closeMcpServerEditSidebar: () =>
        set({
          selectedMcpServer: null,
          isMcpServerEditSidebarOpen: false,
        }),
      updateSelectedMcpServer: (server) =>
        set({ selectedMcpServer: server }),
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
