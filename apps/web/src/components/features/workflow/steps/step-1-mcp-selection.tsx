import { useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { McpSearch } from '../mcp-search';
import { KnowledgeBaseSearch } from '../knowledge-base-search';
import type { StepComponentProps } from '../types';
import type { PackageWithUserStatus } from '@/types';

export function Step1McpSelection({
    data,
    updateData,
    setValid
}: StepComponentProps) {

    // Validate step
    useEffect(() => {
        const isValid = data.name.trim().length > 0 &&
            data.prompt.trim().length > 0 &&
            data.selectedMcps.length > 0;
        setValid(isValid);
    }, [data.name, data.prompt, data.selectedMcps, setValid]);

    const handleToggleMcp = useCallback((pkg: PackageWithUserStatus) => {
        const selectedMcps = data.selectedMcps.filter(mcp => mcp.packageId !== pkg.packageId);
        const isSelected = selectedMcps.length < data.selectedMcps.length;

        if (!isSelected) {
            // Add MCP
            selectedMcps.push(pkg);
        }

        updateData({ selectedMcps });
    }, [data.selectedMcps, updateData]);

    // Handle knowledge base selection with correct logic
    const handleToggleKnowledgeBase = useCallback((kb: any) => {
        const isAlreadySelected = data.selectedKnowledgeBases.some(selected => selected.id === kb.id);

        let selectedKnowledgeBases;
        if (isAlreadySelected) {
            // Remove knowledge base (deselect)
            selectedKnowledgeBases = data.selectedKnowledgeBases.filter(selected => selected.id !== kb.id);
        } else {
            // Add knowledge base (select)
            selectedKnowledgeBases = [...data.selectedKnowledgeBases, kb];
        }

        // Update knowledge base IDs - filter out null/undefined values
        const knowledgeBaseIds = selectedKnowledgeBases
            .map(kb => kb.id)
            .filter((id): id is string => id != null && id !== '');

        updateData({
            selectedKnowledgeBases,
            knowledgeBaseIds
        });
    }, [data.selectedKnowledgeBases, updateData]);

    return (
        <div className="space-y-6">
            {/* Basic Step Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Step Information</h3>

                <div className="space-y-2">
                    <Label htmlFor="step-name">Step Name</Label>
                    <Input
                        id="step-name"
                        placeholder="Enter step name (e.g., 'Send Email', 'Process Data')..."
                        value={data.name}
                        onChange={(e) => updateData({ name: e.target.value })}
                        autoFocus
                    />
                    <p className="text-xs text-gray-500">
                        Give this step a clear, descriptive name
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="prompt">What should this step do?</Label>
                    <Textarea
                        id="prompt"
                        placeholder="Describe what you want this step to accomplish..."
                        value={data.prompt}
                        onChange={(e) => updateData({ prompt: e.target.value })}
                        rows={4}
                    />
                    <p className="text-xs text-gray-500">
                        Be specific about what action this step should perform
                    </p>
                </div>
            </div>

            {/* MCP Selection */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Select Tools (MCPs)</h3>
                    <p className="text-sm text-gray-500">
                        Choose the tools and integrations this step should have access to
                    </p>
                </div>

                <McpSearch
                    selectedMcps={data.selectedMcps}
                    onToggleMcp={handleToggleMcp}
                    placeholder="Search for tools and integrations..."
                />

                {/* {data.selectedMcps.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-amber-800">
                                    Select at least one tool
                                </h3>
                                <p className="mt-1 text-sm text-amber-700">
                                    Your workflow step needs tools to perform actions. Search and select the integrations you need.
                                </p>
                            </div>
                        </div>
                    </div>
                )} */}
            </div>

            {/* Knowledge Base Selection */}
            <div className="space-y-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900">Knowledge Bases</h3>
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                        Select knowledge bases to give your workflow step access to additional context and information
                    </p>
                </div>

                <KnowledgeBaseSearch
                    selectedKnowledgeBases={data.selectedKnowledgeBases}
                    onToggleKnowledgeBase={handleToggleKnowledgeBase}
                    placeholder="Search for knowledge bases..."
                />
            </div>
        </div>
    );
}
