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
    name: string;
    prompt: string;
    selectedMcps: PackageWithUserStatus[];
    mcpDeployments: Record<string, McpDeploymentStatus>;
    deploymentNames: Record<string, string>;
    selectedConnections: Record<string, Record<string, string>>;
    selectedPermissions: Record<string, Record<string, Permission[]>>;
    selectedKnowledgeBases: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
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
