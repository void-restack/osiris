import { useState, useEffect, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { packageQueries } from "@/lib/queries";
import { McpCard } from "../components";
import type { StepProps } from "../types";
import type { PackageWithUserStatus } from "@/types";

interface McpSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (mcp: PackageWithUserStatus) => void;
    selectedMcpIds: string[];
}

function McpSearchDialog({ open, onOpenChange, onSelect, selectedMcpIds }: McpSearchDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: mcpResults, isLoading } = useQuery(
        packageQueries.listOptions({
            name: searchTerm,
            limit: 20,
            page: 1,
        })
    );

    const availableMcps = useMemo(() => {
        if (!mcpResults?.data) return [];
        return mcpResults.data.filter(mcp => !selectedMcpIds.includes(mcp.packageId));
    }, [mcpResults?.data, selectedMcpIds]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Tools to Your Workflow Step</DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search for tools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Results */}
                    <ScrollArea className="flex-1 max-h-[450px]">
                        <div className="space-y-3 pr-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-sm text-gray-500">Searching tools...</div>
                                </div>
                            ) : availableMcps.length === 0 ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-sm text-gray-500">
                                        {searchTerm ? "No tools found for your search" : "No tools available"}
                                    </div>
                                </div>
                            ) : (
                                availableMcps.map((mcp) => (
                                    <Card key={mcp.packageId} className="cursor-pointer max-w-md hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 flex-shrink-0">
                                                    <AvatarImage src={mcp.iconUrl || undefined} alt={mcp.name} />
                                                    <AvatarFallback>{mcp.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-sm">{mcp.name}</h4>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                onSelect(mcp);
                                                                onOpenChange(false);
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                        {mcp.shortDescription || mcp.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function Step1McpSelection({ data, updateData, isValid, setIsValid }: StepProps) {
    const [searchDialogOpen, setSearchDialogOpen] = useState(false);

    // Validation
    useEffect(() => {
        const isFormValid =
            data.name.trim().length > 0 &&
            data.description.trim().length > 0 &&
            data.selectedMcps.length > 0;

        setIsValid(isFormValid);
    }, [data.name, data.description, data.selectedMcps, setIsValid]);

    const handleAddMcp = (mcp: PackageWithUserStatus) => {
        updateData({
            selectedMcps: [...data.selectedMcps, mcp]
        });
    };

    const handleRemoveMcp = (mcpId: string) => {
        updateData({
            selectedMcps: data.selectedMcps.filter(mcp => mcp.packageId !== mcpId)
        });
    };

    const selectedMcpIds = data.selectedMcps.map(mcp => mcp.packageId);

    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Step Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="step-name">Step Name *</Label>
                        <Input
                            id="step-name"
                            placeholder="e.g., Email Analysis, Data Collection"
                            value={data.name}
                            onChange={(e) => updateData({ name: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="step-description">Step Description *</Label>
                        <Textarea
                            id="step-description"
                            placeholder="Describe what this step should accomplish..."
                            value={data.description}
                            onChange={(e) => updateData({ description: e.target.value })}
                            className="mt-1"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* MCP Selection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Selected Tools</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Choose the tools this step will use ({data.selectedMcps.length} selected)
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setSearchDialogOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Tool
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {data.selectedMcps.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No tools selected yet</p>
                            <p className="text-xs mt-1">Add at least one tool to continue</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {data.selectedMcps.map((mcp) => (
                                <McpCard
                                    key={mcp.packageId}
                                    mcp={mcp}
                                    showRemove={true}
                                    onRemove={() => handleRemoveMcp(mcp.packageId)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* MCP Search Dialog */}
            <McpSearchDialog
                open={searchDialogOpen}
                onOpenChange={setSearchDialogOpen}
                onSelect={handleAddMcp}
                selectedMcpIds={selectedMcpIds}
            />
        </div>
    );
}
