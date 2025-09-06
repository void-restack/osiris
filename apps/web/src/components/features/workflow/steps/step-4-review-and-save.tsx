import { useEffect } from 'react';
import { CheckCircle, Package, BookOpen, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { StepComponentProps } from '../types';

export function Step4ReviewAndSave({
    data,
    setValid
}: StepComponentProps) {

    // This step is always valid - just for review
    useEffect(() => {
        setValid(true);
    }, [setValid]);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Review Your Workflow Step</h3>
                <p className="text-sm text-gray-500">
                    Please review the configuration below before saving your workflow step
                </p>
            </div>

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Step Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Name</h4>
                        <p className="text-sm text-gray-600 mt-1">{data.name}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Description</h4>
                        <p className="text-sm text-gray-600 mt-1">{data.prompt}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Selected MCPs */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Selected Tools ({data.selectedMcps.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.selectedMcps.length === 0 ? (
                        <p className="text-sm text-gray-500">No tools selected</p>
                    ) : (
                        <div className="space-y-3">
                            {data.selectedMcps.map((mcp) => {
                                const deployment = data.mcpDeployments[mcp.packageId];

                                return (
                                    <div key={mcp.packageId} className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={mcp.iconUrl} alt={mcp.name} />
                                            <AvatarFallback className="text-xs">
                                                {mcp.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-sm font-medium">{mcp.name}</h5>
                                                {deployment?.status === 'deployed' ? (
                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Deployed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Not Deployed
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{mcp.shortDescription}</p>
                                            {deployment?.deploymentId && (
                                                <p className="text-xs text-gray-400">
                                                    ID: {deployment.deploymentId}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selected Knowledge Bases */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Knowledge Bases ({data.selectedKnowledgeBases.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.selectedKnowledgeBases.length === 0 ? (
                        <p className="text-sm text-gray-500">No knowledge bases selected</p>
                    ) : (
                        <div className="space-y-3">
                            {data.selectedKnowledgeBases.map((kb) => (
                                <div key={kb.id} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={kb.imageUrl} alt={kb.name} />
                                        <AvatarFallback className="text-xs">
                                            <BookOpen className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-sm font-medium">{kb.name}</h5>
                                            {kb.isPublic && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Public
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {kb.description || 'No description available'}
                                        </p>
                                        <p className="text-xs text-gray-400">ID: {kb.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Tools:</span>
                        <span className="ml-2 font-medium">
                            {data.selectedMcps.length} selected
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Knowledge Bases:</span>
                        <span className="ml-2 font-medium">
                            {data.selectedKnowledgeBases.length} selected
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Deployed Tools:</span>
                        <span className="ml-2 font-medium">
                            {Object.values(data.mcpDeployments).filter(d => d.status === 'deployed').length} deployed
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Ready to use:</span>
                        <span className="ml-2 font-medium">
                            {data.deploymentIds.length > 0 ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
