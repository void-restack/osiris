import type { PackageWithUserStatus } from "@/types";

export interface McpDeploymentStatus {
    packageId: string;
    deploymentId?: string;
    status: 'pending' | 'deploying' | 'deployed' | 'failed';
    error?: string;
}

export interface Permission {
    id: string;
    label: string;
}

export interface WorkflowStepFormData {
    // Basic step info
    name: string;
    prompt: string;

    // MCP Selection
    selectedMcps: PackageWithUserStatus[];
    mcpDeployments: Record<string, McpDeploymentStatus>;

    // MCP Deployment Configuration
    deploymentNames: Record<string, string>; // packageId -> deployment name
    selectedConnections: Record<string, Record<string, string>>; // packageId -> serviceName -> connectionId
    selectedPermissions: Record<string, Record<string, Permission[]>>; // packageId -> serviceName -> permissions

    // Knowledge Base Selection  
    selectedKnowledgeBases: Array<{
        id: string;
        name: string;
        description?: string;
    }>;

    // Final data for API
    deploymentIds: string[];
    knowledgeBaseIds: string[];
}

export interface StepComponentProps {
    data: WorkflowStepFormData;
    updateData: (updates: Partial<WorkflowStepFormData>) => void;
    setValid: (isValid: boolean) => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export interface MultiStepDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: WorkflowStepFormData) => Promise<void>;
    initialData?: Partial<WorkflowStepFormData>;
    title?: string;
}
