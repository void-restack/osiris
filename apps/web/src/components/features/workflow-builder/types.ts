import type { PackageWithUserStatus } from "@/types";

export interface McpDeploymentStatus {
    packageId: string;
    deploymentId?: string;
    status: 'idle' | 'configuring' | 'deploying' | 'deployed' | 'error';
}

export interface WorkflowStepBuilderData {
    // Step 1: Basic Info & MCP Selection
    name: string;
    description: string;
    selectedMcps: PackageWithUserStatus[];

    // Step 2: Auth & Deploy tracking
    deploymentIds: string[];
    mcpDeployments: Record<string, McpDeploymentStatus>; // packageId -> deployment info
    selectedConnections: Record<string, Record<string, string>>; // packageId -> serviceName -> connectionId

    // Step 3: Knowledge Bases (future)
    knowledgeBaseIds: string[];
}

export interface StepProps {
    data: WorkflowStepBuilderData;
    updateData: (updates: Partial<WorkflowStepBuilderData>) => void;
    isValid: boolean;
    setIsValid: (valid: boolean) => void;
}

export type WorkflowBuilderStep = 1 | 2 | 3;
