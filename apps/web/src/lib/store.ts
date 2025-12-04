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
  templateWorkflowId?: string;
  agentId: string | null;
  knowledgeBaseId: string | null;
  serviceClient: any | null;
  embedding: any | null;
  timeBasedTrigger: {
    rrule: string;
    startTime: string;
  } | null;
  nextExecution: string | null;
  agents?: Record<string, {
    packageId: string;
    name: string;
    shortDescription: string;
    url: string;
  }>;
  knowledgeBases?: Record<string, {
    id: string;
    name: string;
    description?: string;
  }>;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateWorkflowData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  coverImageUrl?: string;
  workflow: Array<{
    name: string;
    packageIds: string[];
    knowledgeBaseIds?: string[];
    prompt: string;
  }>;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  packages?: Record<string, {
    name: string;
    shortDescription: string;
    url: string;
  }>;
  knowledgeBases?: Record<string, {
    name: string;
    description?: string;
  }>;
}

export interface WorkflowExecutionData {
  id: string;
  flowId: string;
  workflowTitle: string;
  status: "yet-to-be-executed" | "pending" | "running" | "success" | "failed" | "queued";
  createdAt: string;
  updatedAt: string;
  results?: Array<{
    stepId: number;
    status: "yet-to-be-executed" | "pending" | "running" | "success" | "failed";
    errorReason?: string;
    result?: string;
    toolCalls?: any;
    stepName?: string;
    name?: string;
    output?: string;
    error?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
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

  selectedWorkflowExecution: WorkflowExecutionData | null;
  isWorkflowExecutionSidebarOpen: boolean;

  isMainChatSidebarOpen: boolean;

  isProfileSidebarOpen: boolean;

  selectedProfileId: string | null;

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

  openWorkflowExecutionSidebar: (execution: WorkflowExecutionData) => void;
  closeWorkflowExecutionSidebar: () => void;
  updateSelectedWorkflowExecution: (execution: WorkflowExecutionData) => void;

  openMainChatSidebar: () => void;
  closeMainChatSidebar: () => void;

      openProfileSidebar: () => void;
  closeProfileSidebar: () => void;

  setSelectedProfile: (profileId: string | null) => void;
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

      selectedWorkflowExecution: null,
      isWorkflowExecutionSidebarOpen: false,

      isMainChatSidebarOpen: false,

      isProfileSidebarOpen: false,

      selectedProfileId: null,

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
          isWorkflowExecutionSidebarOpen: false,
          selectedWorkflowExecution: null,
          isProfileSidebarOpen: false,
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
          isWorkflowExecutionSidebarOpen: false,
          selectedWorkflowExecution: null,
          isProfileSidebarOpen: false,
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
          isWorkflowExecutionSidebarOpen: false,
          selectedWorkflowExecution: null,
          isProfileSidebarOpen: false,
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
          isWorkflowExecutionSidebarOpen: false,
          selectedWorkflowExecution: null,
          isProfileSidebarOpen: false,
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

      openWorkflowExecutionSidebar: (execution) => {
        set((state) => ({
          selectedWorkflowExecution: execution,
          isWorkflowExecutionSidebarOpen: true,
          isEditSidebarOpen: false,
          selectedConnection: null,
          selectedServiceClient: null,
          isMcpServerEditSidebarOpen: false,
          selectedMcpServer: null,
          isOAuthClientEditSidebarOpen: false,
          selectedOAuthClient: null,
          isWorkflowEditSidebarOpen: false,
          selectedWorkflow: null,
          isProfileSidebarOpen: false,
        }));

        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
      },

      closeWorkflowExecutionSidebar: () =>
        set({
          selectedWorkflowExecution: null,
          isWorkflowExecutionSidebarOpen: false,
        }),

      updateSelectedWorkflowExecution: (execution) =>
        set({ selectedWorkflowExecution: execution }),

      openMainChatSidebar: () =>
        set({ isMainChatSidebarOpen: true }),

      closeMainChatSidebar: () =>
        set({ isMainChatSidebarOpen: false }),

      openProfileSidebar: () => {
        set((state) => ({
          isProfileSidebarOpen: true,
          isEditSidebarOpen: false,
          selectedConnection: null,
          selectedServiceClient: null,
          isMcpServerEditSidebarOpen: false,
          selectedMcpServer: null,
          isOAuthClientEditSidebarOpen: false,
          selectedOAuthClient: null,
          isWorkflowEditSidebarOpen: false,
          selectedWorkflow: null,
          isWorkflowExecutionSidebarOpen: false,
          selectedWorkflowExecution: null,
        }));

        const state = get();
        if (state.setSidebarOpen) {
          state.setSidebarOpen(false);
        }
      },

      closeProfileSidebar: () =>
        set({ isProfileSidebarOpen: false }),

      setSelectedProfile: (profileId) =>
        set({ selectedProfileId: profileId }),

    }),
    {
      name: "osiris-app-store",
      partialize: (state) => ({
        mcpView: state.mcpView,
        knowledgeBaseView: state.knowledgeBaseView,
        selectedProfileId: state.selectedProfileId,
      }),
    },
  ),
);