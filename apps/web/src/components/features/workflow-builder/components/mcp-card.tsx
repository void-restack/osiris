import { X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PackageWithUserStatus } from "@/types";

interface McpCardProps {
    mcp: PackageWithUserStatus;
    onRemove?: () => void;
    showRemove?: boolean;
    showStatus?: boolean;
    status?: 'idle' | 'configuring' | 'deploying' | 'deployed' | 'error';
    onConfigureAuth?: () => void;
    onDeploy?: () => void;
}

export function McpCard({
    mcp,
    onRemove,
    showRemove = false,
    showStatus = false,
    status = 'idle',
    onConfigureAuth,
    onDeploy
}: McpCardProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'configuring': return 'bg-yellow-100 text-yellow-800';
            case 'deploying': return 'bg-blue-100 text-blue-800';
            case 'deployed': return 'bg-green-100 text-green-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'configuring': return 'Configuring Auth';
            case 'deploying': return 'Deploying';
            case 'deployed': return 'Deployed';
            case 'error': return 'Error';
            default: return 'Not Configured';
        }
    };

    return (
        <Card className="relative">
            <CardContent className="p-4">
                {/* Remove Button */}
                {showRemove && onRemove && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-red-100"
                        onClick={onRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}

                <div className="flex items-start gap-3">
                    {/* MCP Icon */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={mcp.iconUrl || undefined} alt={mcp.name} />
                        <AvatarFallback>
                            <Package className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>

                    {/* MCP Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{mcp.name}</h4>
                            {showStatus && (
                                <Badge className={`text-xs ${getStatusColor()}`}>
                                    {getStatusText()}
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2">
                            {mcp.shortDescription || mcp.description}
                        </p>

                        {/* Action Buttons for Step 2 */}
                        {showStatus && (onConfigureAuth || onDeploy) && (
                            <div className="flex gap-2 mt-3">
                                {onConfigureAuth && status !== 'deployed' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onConfigureAuth}
                                        disabled={status === 'configuring' || status === 'deploying'}
                                    >
                                        Configure Auth
                                    </Button>
                                )}
                                {onDeploy && status !== 'deployed' && (
                                    <Button
                                        size="sm"
                                        onClick={onDeploy}
                                        disabled={status === 'deploying' || status === 'configuring'}
                                    >
                                        Deploy
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
