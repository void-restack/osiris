import { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { packageQueries, knowledgeQueries } from "@/lib/queries";
import { useCreateTemplateWorkflowMutation } from "@/lib/mutations";
import { type TemplateWorkflowData } from "@/lib/store";

interface CreateTemplateWorkflowDialogProps {
    children?: React.ReactNode;
}

interface StepSelectorProps {
    stepIndex: number;
    packageIds: string[];
    knowledgeBaseIds: string[];
    onPackageIdsChange: (packageIds: string[]) => void;
    onKnowledgeBaseIdsChange: (knowledgeBaseIds: string[]) => void;
}

function StepSelector({ stepIndex, packageIds, knowledgeBaseIds, onPackageIdsChange, onKnowledgeBaseIdsChange }: StepSelectorProps) {
    const [mcpCommandOpen, setMcpCommandOpen] = useState(false);
    const [kbCommandOpen, setKbCommandOpen] = useState(false);
    const [mcpSearchQuery, setMcpSearchQuery] = useState("");
    const [kbSearchQuery, setKbSearchQuery] = useState("");

    const queryClient = useQueryClient();

    // Fetch packages and knowledge bases
    const { data: popularPackages } = useQuery({
        ...packageQueries.popularOptions(),
        select: (data) => data?.data || []
    });

    const { data: mcpSearchResults } = useQuery({
        queryKey: ['packages', 'search', mcpSearchQuery],
        queryFn: async () => {
            if (!mcpSearchQuery || mcpSearchQuery.length < 2) return [];
            const response = await queryClient.ensureQueryData(packageQueries.listOptions({
                name: mcpSearchQuery,
                page: 1,
                limit: 12
            }));
            return response.data || [];
        },
        enabled: mcpSearchQuery.length >= 2,
    });

    const { data: popularKnowledgeBases } = useQuery({
        ...knowledgeQueries.basesOptions({ isPublic: true, limit: 10 }),
        select: (data) => data?.data || []
    });

    const { data: kbSearchResults } = useQuery({
        queryKey: ['knowledge-bases', 'search', kbSearchQuery],
        queryFn: async () => {
            if (!kbSearchQuery || kbSearchQuery.length < 2) return [];
            const response = await queryClient.ensureQueryData(knowledgeQueries.searchOptions({
                name: kbSearchQuery,
                isPublic: true,
                page: 1,
                limit: 12
            }));
            return response.data || [];
        },
        enabled: kbSearchQuery.length >= 2,
    });

    const addPackage = (provider: any) => {
        const providerId = provider.id || provider.packageId;
        if (!packageIds.includes(providerId)) {
            onPackageIdsChange([...packageIds, providerId]);
        }
        setMcpCommandOpen(false);
        setMcpSearchQuery("");
    };

    const removePackage = (providerId: string) => {
        onPackageIdsChange(packageIds.filter(id => id !== providerId));
    };

    const addKnowledgeBase = (knowledgeBase: any) => {
        const kbId = knowledgeBase.knowledgeBaseId || knowledgeBase.knowledge_bases?.knowledgeBaseId;
        if (!knowledgeBaseIds.includes(kbId)) {
            onKnowledgeBaseIdsChange([...knowledgeBaseIds, kbId]);
        }
        setKbCommandOpen(false);
        setKbSearchQuery("");
    };

    const removeKnowledgeBase = (kbId: string) => {
        onKnowledgeBaseIdsChange(knowledgeBaseIds.filter(id => id !== kbId));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm text-primary-400">Packages</Label>
                <Popover open={mcpCommandOpen} onOpenChange={setMcpCommandOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={mcpCommandOpen}
                            className="justify-between w-full"
                        >
                            Select packages...
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput
                                placeholder="Search packages..."
                                value={mcpSearchQuery}
                                onValueChange={setMcpSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No packages found.</CommandEmpty>
                                {(mcpSearchQuery.length >= 2 ? mcpSearchResults : popularPackages)?.length > 0 && (
                                    <CommandGroup heading={mcpSearchQuery.length >= 2 ? "Search Results" : "Popular Packages"}>
                                        {(mcpSearchQuery.length >= 2 ? mcpSearchResults : popularPackages)?.map((provider: any) => (
                                            <CommandItem
                                                key={provider.id || provider.packageId}
                                                onSelect={() => addPackage(provider)}
                                                className="cursor-pointer"
                                            >
                                                {provider.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {packageIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {packageIds.map((pkgId: string) => {
                            const provider = [...(popularPackages || []), ...(mcpSearchResults || [])].find(p => (p.id || p.packageId) === pkgId);
                            return (
                                <Badge key={pkgId} variant="secondary" className="flex items-center gap-1">
                                    {provider?.name || pkgId}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => removePackage(pkgId)}
                                    >
                                        <X size={12} />
                                    </Button>
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-primary-400">Knowledge Bases</Label>
                <Popover open={kbCommandOpen} onOpenChange={setKbCommandOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kbCommandOpen}
                            className="justify-between w-full"
                        >
                            Select knowledge bases...
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput
                                placeholder="Search knowledge bases..."
                                value={kbSearchQuery}
                                onValueChange={setKbSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No knowledge bases found.</CommandEmpty>
                                {(kbSearchQuery.length >= 2 ? kbSearchResults : popularKnowledgeBases)?.length > 0 && (
                                    <CommandGroup heading={kbSearchQuery.length >= 2 ? "Search Results" : "Popular Knowledge Bases"}>
                                        {(kbSearchQuery.length >= 2 ? kbSearchResults : popularKnowledgeBases)?.map((kb: any) => {
                                            const kbData = kb.knowledge_bases || kb;
                                            const kbId = kbData.knowledgeBaseId;
                                            const kbName = kbData.name;
                                            return (
                                                <CommandItem
                                                    key={kbId}
                                                    onSelect={() => addKnowledgeBase(kb)}
                                                    className="cursor-pointer"
                                                >
                                                    {kbName}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {knowledgeBaseIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {knowledgeBaseIds.map((kbId: string) => {
                            const kb = [...(popularKnowledgeBases || []), ...(kbSearchResults || [])].find(k => {
                                const kbData = k.knowledge_bases || k;
                                return kbData.knowledgeBaseId === kbId;
                            });
                            const kbData = kb?.knowledge_bases || kb;
                            const kbName = kbData?.name || kbId;
                            return (
                                <Badge key={kbId} variant="secondary" className="flex items-center gap-1">
                                    {kbName}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => removeKnowledgeBase(kbId)}
                                    >
                                        <X size={12} />
                                    </Button>
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function CreateTemplateWorkflowDialog({ children }: CreateTemplateWorkflowDialogProps) {
    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();
    const createTemplateWorkflowMutation = useCreateTemplateWorkflowMutation();

    const form = useForm({
        defaultValues: {
            title: "",
            description: "",
            imageUrl: "",
            coverImageUrl: "",
            isPublic: false,
            workflow: [
                {
                    name: "",
                    packageIds: [] as string[],
                    knowledgeBaseIds: [] as string[],
                    prompt: "",
                },
            ],
        },
        onSubmit: async ({ value }) => {
            try {
                const templateData: any = {
                    title: value.title,
                    description: value.description,
                    imageUrl: value.imageUrl?.trim() || "",
                    coverImageUrl: value.coverImageUrl?.trim() || "",
                    isPublic: value.isPublic,
                    workflow: value.workflow.map(step => ({
                        name: step.name,
                        packageIds: step.packageIds,
                        knowledgeBaseIds: step.knowledgeBaseIds,
                        prompt: step.prompt,
                    })),
                };

                await createTemplateWorkflowMutation.mutateAsync(templateData);

                setOpen(false);
                form.reset();
            } catch (error) {
                console.error("Failed to create template workflow:", error);
            }
        },
    });

    const addWorkflowStep = () => {
        form.setFieldValue("workflow", [
            ...form.getFieldValue("workflow"),
            {
                name: "",
                packageIds: [] as string[],
                knowledgeBaseIds: [] as string[],
                prompt: "",
            },
        ]);
    };

    const removeWorkflowStep = (index: number) => {
        const currentWorkflow = form.getFieldValue("workflow");
        if (currentWorkflow.length > 1) {
            form.setFieldValue(
                "workflow",
                currentWorkflow.filter((_, i) => i !== index)
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline2">
                        <Plus className="h-4 w-4" />
                        <span>Create Template</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                        Create a new workflow template by defining its steps and packages.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <form.Field
                                name="title"
                                validators={{
                                    onChange: ({ value }) =>
                                        !value ? "Title is required" : undefined,
                                }}
                            >
                                {(field) => (
                                    <>
                                        <Input
                                            id="title"
                                            placeholder="Enter template title"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-sm text-red-500">
                                                {field.state.meta.errors[0]}
                                            </p>
                                        )}
                                    </>
                                )}
                            </form.Field>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <form.Field name="description">
                                {(field) => (
                                    <Textarea
                                        id="description"
                                        placeholder="Enter template description"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        rows={3}
                                    />
                                )}
                            </form.Field>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <form.Field name="imageUrl">
                                {(field) => (
                                    <Input
                                        id="imageUrl"
                                        placeholder="Enter image URL (optional)"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                )}
                            </form.Field>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                            <form.Field name="coverImageUrl">
                                {(field) => (
                                    <Input
                                        id="coverImageUrl"
                                        placeholder="Enter cover image URL (optional)"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                )}
                            </form.Field>
                        </div>

                        <div className="flex items-center space-x-2">
                            <form.Field name="isPublic">
                                {(field) => (
                                    <Switch
                                        id="isPublic"
                                        checked={field.state.value}
                                        onCheckedChange={field.handleChange}
                                    />
                                )}
                            </form.Field>
                            <Label htmlFor="isPublic">Make this template public</Label>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Template Steps</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addWorkflowStep}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Step
                                </Button>
                            </div>

                            <form.Field name="workflow">
                                {(field) => (
                                    <div className="space-y-4">
                                        {field.state.value.map((step, index) => (
                                            <div key={index} className="border rounded-lg p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">Step {index + 1}</h4>
                                                    {field.state.value.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeWorkflowStep(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor={`step-${index}-name`}>Step Name</Label>
                                                    <form.Field name={`workflow[${index}].name`}>
                                                        {(stepField) => (
                                                            <Input
                                                                id={`step-${index}-name`}
                                                                placeholder="Enter step name"
                                                                value={stepField.state.value}
                                                                onChange={(e) => stepField.handleChange(e.target.value)}
                                                            />
                                                        )}
                                                    </form.Field>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor={`step-${index}-prompt`}>Prompt</Label>
                                                    <form.Field name={`workflow[${index}].prompt`}>
                                                        {(stepField) => (
                                                            <Textarea
                                                                id={`step-${index}-prompt`}
                                                                placeholder="Enter step prompt"
                                                                value={stepField.state.value}
                                                                onChange={(e) => stepField.handleChange(e.target.value)}
                                                                rows={3}
                                                            />
                                                        )}
                                                    </form.Field>
                                                </div>

                                                <StepSelector
                                                    stepIndex={index}
                                                    packageIds={step.packageIds || []}
                                                    knowledgeBaseIds={step.knowledgeBaseIds || []}
                                                    onPackageIdsChange={(packageIds) => {
                                                        form.setFieldValue(`workflow[${index}].packageIds`, packageIds);
                                                    }}
                                                    onKnowledgeBaseIdsChange={(knowledgeBaseIds) => {
                                                        form.setFieldValue(`workflow[${index}].knowledgeBaseIds`, knowledgeBaseIds);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </form.Field>
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={() => form.handleSubmit()}
                        disabled={createTemplateWorkflowMutation.isPending}
                    >
                        {createTemplateWorkflowMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}