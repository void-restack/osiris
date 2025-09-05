import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserServiceConnection, type ServiceClient } from "@/types/auth";

export type McpViewType = "list" | "directory";
export type KnowledgeBaseViewType = "list" | "directory";

export interface McpServerData {
  deploymentId: string;
  userMcpId: string;
  url: string;
  scopes: string[];
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
  userServiceConnectionMcpDeployments?: Array<{
    connectionId: string;
    serviceClient: {
      type: string;
      name: string;
    };
    scopes: string[];
    policy: any;
  }>;
  name?: string;
}

export interface OAuthClientData {
  clientId: string;
  developerId: string;
  name: string;
  iconUrl: string | null;
  redirectUris: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  coverImageUrl?: string;
  workflow: Array<{
    name: string;
    prompt: string;
    deploymentId: string[];
    knowledgeBaseIds: string[];
  }>;
  isPublic: boolean;
  agentId: string | null;
  knowledgeBaseId: string | null;
  serviceClient: any | null;
  embedding: any | null;
  timeBasedTrigger: {
    rrule: string;
    startTime: string;
  } | null;
  nextExecution: string | null;
  ownerId: string;
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

  selectedMcpServer: McpServerData | null;
  isMcpServerEditSidebarOpen: boolean;

  selectedOAuthClient: OAuthClientData | null;
  isOAuthClientEditSidebarOpen: boolean;

  selectedWorkflow: WorkflowData | null;
  isWorkflowEditSidebarOpen: boolean;

  openEditSidebar: (
    connection: UserServiceConnection,
    serviceClient?: ServiceClient,
  ) => void;
  closeEditSidebar: () => void;
  updateSelectedConnection: (connection: UserServiceConnection) => void;
  setSidebarOpen?: (open: boolean) => void;
  setSidebarOpenCallback: (callback: (open: boolean) => void) => void;

  openMcpServerEditSidebar: (server: McpServerData) => void;
  closeMcpServerEditSidebar: () => void;
  updateSelectedMcpServer: (server: McpServerData) => void;

  openOAuthClientEditSidebar: (client: OAuthClientData) => void;
  closeOAuthClientEditSidebar: () => void;
  updateSelectedOAuthClient: (client: OAuthClientData) => void;

  openWorkflowEditSidebar: (workflow: WorkflowData) => void;
  closeWorkflowEditSidebar: () => void;
  updateSelectedWorkflow: (workflow: WorkflowData) => void;
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

      selectedMcpServer: null,
      isMcpServerEditSidebarOpen: false,

      selectedOAuthClient: null,
      isOAuthClientEditSidebarOpen: false,

      selectedWorkflow: null,
      isWorkflowEditSidebarOpen: false,

      openEditSidebar: (connection, serviceClient) => {
        set((state) => ({
          selectedConnection: connection,
          selectedServiceClient: serviceClient || connection.serviceClient || null,
          isEditSidebarOpen: true,
          isMcpServerEditSidebarOpen: false,
          selectedMcpServer: null,
          isOAuthClientEditSidebarOpen: false,
          selectedOAuthClient: null,
          isWorkflowEditSidebarOpen: false,
          selectedWorkflow: null,
        }));

        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
      },

      closeEditSidebar: () =>
        set({
          selectedConnection: null,
          selectedServiceClient: null,
          isEditSidebarOpen: false,
        }),

      updateSelectedConnection: (connection) =>
        set({ selectedConnection: connection }),

      setSidebarOpenCallback: (callback) =>
        set({ setSidebarOpen: callback }),

      openMcpServerEditSidebar: (server) => {
        set((state) => ({
          selectedMcpServer: server,
          isMcpServerEditSidebarOpen: true,
          isEditSidebarOpen: false,
          selectedConnection: null,
          selectedServiceClient: null,
          isOAuthClientEditSidebarOpen: false,
          selectedOAuthClient: null,
          isWorkflowEditSidebarOpen: false,
          selectedWorkflow: null,
        }));

        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
      },

      closeMcpServerEditSidebar: () =>
        set({
          selectedMcpServer: null,
          isMcpServerEditSidebarOpen: false,
        }),

      updateSelectedMcpServer: (server) =>
        set({ selectedMcpServer: server }),

      openOAuthClientEditSidebar: (client) => {
        set((state) => ({
          selectedOAuthClient: client,
          isOAuthClientEditSidebarOpen: true,
          isEditSidebarOpen: false,
          selectedConnection: null,
          selectedServiceClient: null,
          isMcpServerEditSidebarOpen: false,
          selectedMcpServer: null,
          isWorkflowEditSidebarOpen: false,
          selectedWorkflow: null,
        }));

        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
      },

      closeOAuthClientEditSidebar: () =>
        set({
          selectedOAuthClient: null,
          isOAuthClientEditSidebarOpen: false,
        }),

      updateSelectedOAuthClient: (client) =>
        set({ selectedOAuthClient: client }),

      openWorkflowEditSidebar: (workflow) => {
        set((state) => ({
          selectedWorkflow: workflow,
          isWorkflowEditSidebarOpen: true,
          isEditSidebarOpen: false,
          selectedConnection: null,
          selectedServiceClient: null,
          isMcpServerEditSidebarOpen: false,
          selectedMcpServer: null,
          isOAuthClientEditSidebarOpen: false,
          selectedOAuthClient: null,
        }));

        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
      },

      closeWorkflowEditSidebar: () =>
        set({
          selectedWorkflow: null,
          isWorkflowEditSidebarOpen: false,
        }),

      updateSelectedWorkflow: (workflow) =>
        set({ selectedWorkflow: workflow }),
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