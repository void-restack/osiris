import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus, BookOpen } from "lucide-react";
import { knowledgeQueries } from "@/lib/queries";
import type { StepProps } from "../types";

interface KnowledgeBase {
    id: string;
    name: string;
    description?: string;
    isPublic?: boolean;
}

export function Step3KnowledgeBases({ data, updateData, isValid, setIsValid }: StepProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // For now, always valid since knowledge bases are optional
    useEffect(() => {
        setIsValid(true);
    }, [setIsValid]);

    // Mock knowledge base data - replace with actual query when available
    const { data: knowledgeBases, isLoading } = useQuery({
        queryKey: ["knowledge-bases", searchTerm],
        queryFn: async () => {
            // Mock data for now - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            return [
                {
                    id: "kb-1",
                    name: "Company Documentation",
                    description: "Internal company documentation and policies",
                    isPublic: false
                },
                {
                    id: "kb-2",
                    name: "API Reference",
                    description: "Technical API documentation and examples",
                    isPublic: true
                },
                {
                    id: "kb-3",
                    name: "User Guides",
                    description: "Customer-facing user guides and tutorials",
                    isPublic: true
                }
            ].filter(kb =>
                searchTerm === "" ||
                kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (kb.description && kb.description.toLowerCase().includes(searchTerm.toLowerCase()))
            ) as KnowledgeBase[];
        },
        enabled: true
    });

    const selectedKnowledgeBaseIds = data.knowledgeBaseIds || [];

    const handleToggleKnowledgeBase = (kb: KnowledgeBase) => {
        const isSelected = selectedKnowledgeBaseIds.includes(kb.id);

        let newKnowledgeBaseIds: string[];
        if (isSelected) {
            newKnowledgeBaseIds = selectedKnowledgeBaseIds.filter(id => id !== kb.id);
        } else {
            newKnowledgeBaseIds = [...selectedKnowledgeBaseIds, kb.id];
        }

        updateData({
            knowledgeBaseIds: newKnowledgeBaseIds
        });
    };

    const handleRemoveKnowledgeBase = (kbId: string) => {
        updateData({
            knowledgeBaseIds: selectedKnowledgeBaseIds.filter(id => id !== kbId)
        });
    };

    return (
        <div className="space-y-6">
            {/* Info Message */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <p className="text-sm text-purple-700">
                    Optional: Add knowledge bases to provide context and information for your workflow step.
                </p>
            </div>

            {/* Selected Knowledge Bases */}
            {selectedKnowledgeBaseIds.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Selected Knowledge Bases ({selectedKnowledgeBaseIds.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {selectedKnowledgeBaseIds.map(kbId => {
                                const kb = knowledgeBases?.find(k => k.id === kbId);
                                return (
                                    <Badge key={kbId} variant="secondary" className="flex items-center gap-2">
                                        <BookOpen className="h-3 w-3" />
                                        {kb?.name || `Knowledge Base ${kbId}`}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => handleRemoveKnowledgeBase(kbId)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Knowledge Base Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Available Knowledge Bases</CardTitle>
                    <p className="text-sm text-gray-500">
                        Search and select knowledge bases to enhance your workflow step
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Search Input */}
                    <div className="space-y-4">
                        <div className="relative">
                            <Label htmlFor="kb-search">Search Knowledge Bases</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="kb-search"
                                    placeholder="Search by name or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Results */}
                        <ScrollArea className="h-[300px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-sm text-gray-500">Loading knowledge bases...</div>
                                </div>
                            ) : knowledgeBases && knowledgeBases.length > 0 ? (
                                <div className="space-y-3 pr-4">
                                    {knowledgeBases.map((kb) => {
                                        const isSelected = selectedKnowledgeBaseIds.includes(kb.id);
                                        return (
                                            <div
                                                key={kb.id}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                                    }`}
                                                onClick={() => handleToggleKnowledgeBase(kb)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <BookOpen className="h-4 w-4 text-gray-600" />
                                                            <h4 className="font-medium text-gray-900 truncate">
                                                                {kb.name}
                                                            </h4>
                                                            {kb.isPublic && (
                                                                <Badge variant="outline" className="text-xs">Public</Badge>
                                                            )}
                                                        </div>
                                                        {kb.description && (
                                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                                {kb.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant={isSelected ? "default" : "outline"}
                                                        size="sm"
                                                        className="ml-3"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleKnowledgeBase(kb);
                                                        }}
                                                    >
                                                        {isSelected ? (
                                                            <>
                                                                <X className="h-4 w-4 mr-1" />
                                                                Remove
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                Add
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-sm">
                                        {searchTerm ? "No knowledge bases found matching your search." : "No knowledge bases available."}
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Step Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Workflow Step:</strong> {data.name || "Untitled Step"}</p>
                        <p><strong>Selected Tools:</strong> {data.selectedMcps.length} MCP(s)</p>
                        <p><strong>Deployed Tools:</strong> {Object.values(data.mcpDeployments).filter(d => d.status === 'deployed').length}</p>
                        <p><strong>Knowledge Bases:</strong> {selectedKnowledgeBaseIds.length} selected</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
