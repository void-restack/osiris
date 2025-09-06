import { useState, useMemo } from 'react';
import { CheckCircle, AlertCircle, Loader2, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PackageWithUserStatus } from '@/types';
import type { McpDeploymentStatus } from '../types';

interface McpDeploymentConfigProps {
    pkg: PackageWithUserStatus;
    deployment?: McpDeploymentStatus;
    deploymentName: string;
    onDeploymentNameChange: (name: string) => void;
    onDeploy: () => Promise<void>;
    isDeploying: boolean;
    isExpanded: boolean;
    onToggleExpanded: () => void;
}

export function McpDeploymentConfig({
    pkg,
    deployment,
    deploymentName,
    onDeploymentNameChange,
    onDeploy,
    isDeploying,
    isExpanded,
    onToggleExpanded
}: McpDeploymentConfigProps) {

    // Simplified validation - just check deployment name
    const isReadyToDeploy = useMemo(() => {
        return deploymentName.trim().length > 0;
    }, [deploymentName]);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
                            <AvatarFallback>
                                {pkg.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <CardTitle className="text-base">{pkg.name}</CardTitle>
                            <p className="text-sm text-gray-500">
                                {pkg.shortDescription}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {deployment?.status === 'deployed' && (
                            <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Deployed
                            </Badge>
                        )}
                        {deployment?.status === 'failed' && (
                            <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Failed
                            </Badge>
                        )}
                        {isDeploying && (
                            <Badge className="bg-blue-100 text-blue-800">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Deploying
                            </Badge>
                        )}

                        <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Configure
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>

                        {deployment?.status !== 'deployed' && (
                            <Button
                                size="sm"
                                onClick={onDeploy}
                                disabled={isDeploying || !isReadyToDeploy}
                            >
                                {isDeploying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        Deploying
                                    </>
                                ) : (
                                    'Deploy'
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <Collapsible open={isExpanded}>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-6 border-t pt-4">
                            {/* Deployment Name */}
                            <div className="space-y-2">
                                <Label htmlFor={`deployment-name-${pkg.packageId}`}>
                                    Deployment Name
                                </Label>
                                <Input
                                    id={`deployment-name-${pkg.packageId}`}
                                    value={deploymentName}
                                    onChange={(e) => onDeploymentNameChange(e.target.value)}
                                    placeholder={`${pkg.name} deployment`}
                                />
                            </div>

                            {/* Placeholder for future service configuration */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    Service permissions and connections configuration will be available in a future update.
                                </p>
                            </div>

                            {/* Status Messages */}
                            {deployment?.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">
                                                Deployment Failed
                                            </h4>
                                            <p className="text-sm text-red-700 mt-1">
                                                {deployment.error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {deployment?.status === 'deployed' && deployment.deploymentId && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                        <div>
                                            <h4 className="text-sm font-medium text-green-800">
                                                Successfully Deployed
                                            </h4>
                                            <p className="text-sm text-green-700 mt-1">
                                                Deployment ID: {deployment.deploymentId}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Validation Messages */}
                            {!isReadyToDeploy && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-800">
                                                Configuration Required
                                            </h4>
                                            <ul className="text-sm text-amber-700 mt-1 space-y-1">
                                                {!deploymentName.trim() && (
                                                    <li>• Enter a deployment name</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
