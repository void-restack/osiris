import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { Plus, Loader2, X, XIcon, Image, AlertCircleIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { packageQueries, knowledgeQueries } from "@/lib/queries";
import { useCreateTemplateWorkflowMutation } from "@/lib/mutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useTemplateUpload } from "@/hooks/use-template-upload";
import { useFileUpload } from "@/hooks/use-file-upload";

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

    const { data: popularPackages } = useQuery({
        ...packageQueries.popularOptions(),
        select: (data) => data?.data || []
    });

    const { data: mcpSearchResults } = useQuery({
        queryKey: ['packages', 'search', mcpSearchQuery],
        queryFn: async () => {
            if (!mcpSearchQuery || mcpSearchQuery.length < 1) return [];
            const response = await queryClient.ensureQueryData(packageQueries.listOptions({
                name: mcpSearchQuery,
                page: 1,
                limit: 12,
                isLive: true
            }));
            return response.data || [];
        },
        enabled: mcpSearchQuery.length >= 1,
    });

    const { data: popularKnowledgeBases } = useQuery({
        ...knowledgeQueries.popularOptions({ isPublic: true, limit: 10 }),
        select: (data) => data?.data || []
    });

    const { data: kbSearchResults } = useQuery({
        queryKey: ['knowledge-bases', 'search', kbSearchQuery],
        queryFn: async () => {
            if (!kbSearchQuery || kbSearchQuery.length < 1) return [];
            const response = await queryClient.ensureQueryData(knowledgeQueries.searchOptions({
                name: kbSearchQuery,
                isPublic: true,
                page: 1,
                limit: 12
            }));
            return response.data || [];
        },
        enabled: kbSearchQuery.length >= 1,
    });

    const addPackage = (provider: any) => {
        const providerId = provider.id || provider.packageId;
        if (!packageIds.includes(providerId)) {
            onPackageIdsChange([...packageIds, providerId]);
        }
        setMcpCommandOpen(false);
        setMcpSearchQuery("");
    };

    const handleMcpButtonClick = () => {
        console.log("MCP button clicked, current state:", mcpCommandOpen);
        setMcpCommandOpen(!mcpCommandOpen);
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

    const handleKbButtonClick = () => {
        console.log("KB button clicked, current state:", kbCommandOpen);
        setKbCommandOpen(!kbCommandOpen);
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
                            type="button"
                            variant="secondary"
                            role="combobox"
                            aria-expanded={mcpCommandOpen}
                            className="justify-between w-full"
                            onClick={handleMcpButtonClick}
                        >
                            Select packages...
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-[100001]">
                        <Command>
                            <CommandInput
                                placeholder="Search packages..."
                                value={mcpSearchQuery}
                                onValueChange={setMcpSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No packages found.</CommandEmpty>
                                {(mcpSearchQuery.length >= 1 ? mcpSearchResults : popularPackages)?.length > 0 && (
                                    <CommandGroup heading={mcpSearchQuery.length >= 1 ? "Search Results" : "Popular Packages"}>
                                        {(mcpSearchQuery.length >= 1 ? mcpSearchResults : popularPackages)?.map((provider: any) => (
                                            <CommandItem
                                                key={provider.id || provider.packageId}
                                                onSelect={() => addPackage(provider)}
                                                className="cursor-pointer"
                                            >
                                                <Avatar className="size-4">
                                                    <AvatarImage src={provider.iconUrl} alt={provider.name} className="size-4 flex items-center justify-center" />
                                                    <AvatarFallback>{provider.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
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
                                <Badge key={pkgId} variant="secondary" className="flex items-center gap-1 pr-0">
                                    <Avatar className="size-4">
                                        <AvatarImage src={provider.iconUrl} alt={provider.name} className="size-4 flex items-center justify-center" />
                                        <AvatarFallback>{provider.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>
                                        {provider?.name || pkgId}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => removePackage(pkgId)}
                                    >
                                        <X size={4} />
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
                            type="button"
                            variant="secondary"
                            role="combobox"
                            aria-expanded={kbCommandOpen}
                            className="justify-between w-full"
                            onClick={handleKbButtonClick}
                        >
                            Select knowledge bases...
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-[100001]">
                        <Command>
                            <CommandInput
                                placeholder="Search knowledge bases..."
                                value={kbSearchQuery}
                                onValueChange={setKbSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No knowledge bases found.</CommandEmpty>
                                {(kbSearchQuery.length >= 1 ? kbSearchResults : popularKnowledgeBases)?.length > 0 && (
                                    <CommandGroup heading={kbSearchQuery.length >= 1 ? "Search Results" : "Popular Knowledge Bases"}>
                                        {(kbSearchQuery.length >= 1 ? kbSearchResults : popularKnowledgeBases)?.map((kb: any) => {
                                            const kbData = kb.knowledge_bases || kb;
                                            const kbId = kbData.knowledgeBaseId;
                                            const kbName = kbData.name;
                                            return (
                                                <CommandItem
                                                    key={kbId}
                                                    onSelect={() => addKnowledgeBase(kb)}
                                                    className="cursor-pointer"
                                                >
                                                    <Avatar className="size-4">
                                                        <AvatarImage src={kb.iconUrl} alt={kbName} className="size-4 flex items-center justify-center" />
                                                        <AvatarFallback>{kbName.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm truncate">
                                                        {kbName}
                                                    </span>
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
                                <Badge key={kbId} variant="secondary" className="flex items-center gap-1 pr-0">
                                    <Avatar className="size-4">
                                        <AvatarImage src={kb.iconUrl} alt={kbName} className="size-4 flex items-center justify-center" />
                                        <AvatarFallback>{kbName.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm truncate">
                                        {kbName}
                                    </span>
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
    const [isCreating, setIsCreating] = useState(false);
    const uploadHook = useTemplateUpload();

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
            setIsCreating(true);
            try {
                const { logoUrl, coverImageUrl } = await uploadHook.uploadFiles();
                const templateData: any = {
                    title: value.title,
                    description: value.description,
                    imageUrl: logoUrl || "",
                    coverImageUrl: coverImageUrl || "",
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
                uploadHook.reset();
            } catch (error) {
                console.error("Failed to create template workflow:", error);
            } finally {
                setIsCreating(false);
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

    // Reset loading state when dialog closes
    useEffect(() => {
        if (!open) {
            setIsCreating(false);
        }
    }, [open]);

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
            <DialogContent className="max-h-[80vh] hidebar z-[100000]">
                <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                        Create a new workflow template by defining its steps and packages.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-auto p-0 hidebar">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-6 hidebar"
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
                                            className="focus:border-0 focus:ring-0 focus:outline-none"
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

                        <div className="space-y-4">
                            <div className="flex w-full flex-col gap-y-6 border-primary-100 border-b border-dashed pb-8">
                                <AvatarUploader
                                    onChange={uploadHook.setLogoFile}
                                    uploadState={uploadHook.state}
                                />
                                <BannerUploader
                                    onChange={uploadHook.setCoverImageFile}
                                    uploadState={uploadHook.state}
                                />
                            </div>
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
                                    variant="outline2"
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
                                            <div key={index} className="border border-primary-100 border-dashed rounded-lg p-3 space-y-4">
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
                </div>

                <DialogFooter className="flex items-center justify-between w-full border-t border-primary-100 pt-4">
                    <Button
                        type="button"
                        variant="outline2"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="inset-shadow-search-btn"
                        onClick={() => form.handleSubmit()}
                        disabled={isCreating || uploadHook.state.isUploading}
                    >
                        {isCreating && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isCreating ? "Creating..." : "Create Template"}
                    </Button>
                </DialogFooter>
                {(createTemplateWorkflowMutation.isError || uploadHook.state.error) && !isCreating && (
                    <div className="text-red-500 text-sm mt-2">
                        Error
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AvatarUploader({
    onChange,
    uploadState,
}: {
    onChange: (file: File | null) => void;
    uploadState: {
        logoFile: File | null;
        coverImageFile: File | null;
        logoUrl: string | null;
        coverImageUrl: string | null;
        isUploading: boolean;
        uploadProgress: {
            logo: number;
            coverImage: number;
        };
        error: string | null;
    };
}) {
    const [
        { files, isDragging },
        {
            removeFile,
            openFileDialog,
            getInputProps,
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
        },
    ] = useFileUpload({
        accept: "image/*",
        maxFiles: 1
    });

    const previewUrl = files[0]?.preview || null;

    useEffect(() => {
        const file = files[0]?.file instanceof File ? files[0].file : null;
        onChange(file);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    return (
        <div
            className="flex cursor-pointer items-center gap-4 "
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            aria-label={previewUrl ? "Change image" : "Upload image"}
        >
            <div className="relative inline-flex">
                <button type="button" className="relative flex size-[60px] items-center justify-center overflow-hidden rounded-[8px] border border-primary-100 border-dashed outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-disabled:pointer-events-none has-[img]:border-none has-disabled:opacity-50 data-[dragging=true]:bg-accent/50">
                    {previewUrl ? (
                        <img
                            className="size-full object-cover"
                            src={previewUrl}
                            alt={files[0]?.file?.name || "Uploaded image"}
                            width={64}
                            height={64}
                            style={{ objectFit: "cover" }}
                        />
                    ) : (
                        <div
                            className="flex size-[60px] shrink-0 items-center justify-center rounded-[8px] bg-primary-00"
                            aria-hidden="true"
                        >
                            <Image className="size-5 stroke-primary-400" />
                        </div>
                    )}
                </button>
                {previewUrl && (
                    <Button
                        type="button"
                        onClick={() => removeFile(files[0]?.id)}
                        size="icon"
                        className="-top-1 -right-1 absolute size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                        aria-label="Remove image"
                    >
                        <XIcon className="size-3.5" />
                    </Button>
                )}
                <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload image file"
                    tabIndex={-1}
                />
            </div>
            <div aria-live="polite" role="region" className="">
                <p className="text-primary-800 text-sm">
                    Upload Template icon
                </p>
                <p className="text-primary-400 text-sm">
                    SVG, PNG, JPG or GIF (max. 400x400px)
                </p>
                {uploadState.isUploading && uploadState.uploadProgress.logo > 0 && (
                    <div className="mt-2">
                        <div className="text-xs text-primary-600 mb-1">
                            Uploading image...
                        </div>
                        <div className="w-full bg-primary-100 rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadState.uploadProgress.logo}%` }}
                            />
                        </div>
                    </div>
                )}
                {uploadState.logoUrl && (
                    <div className="text-xs text-green-600 mt-1">
                        ✓ Image uploaded successfully
                    </div>
                )}
            </div>
        </div>
    );
}

function BannerUploader({
    onChange,
    uploadState,
}: {
    onChange: (file: File | null) => void;
    uploadState: {
        logoFile: File | null;
        coverImageFile: File | null;
        logoUrl: string | null;
        coverImageUrl: string | null;
        isUploading: boolean;
        uploadProgress: {
            logo: number;
            coverImage: number;
        };
        error: string | null;
    };
}) {
    const maxSizeMB = 5;
    const maxSize = maxSizeMB * 1024 * 1024;

    const [
        { files, isDragging, errors },
        {
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
            openFileDialog,
            removeFile,
            getInputProps,
        },
    ] = useFileUpload({
        accept: "image/*",
        maxSize,
    });

    const previewUrl = files[0]?.preview || null;

    useEffect(() => {
        const file = files[0]?.file instanceof File ? files[0].file : null;
        onChange(file);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <div
                    role="button"
                    onClick={openFileDialog}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    data-dragging={isDragging || undefined}
                    className="relative flex min-h-[125px] flex-col items-center justify-center overflow-hidden rounded-[6px] border border-primary-100 px-5 py-4 transition-colors has-disabled:pointer-events-none has-[input:focus]:border-ring has-[img]:border-none has-disabled:opacity-50 has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
                >
                    <input
                        {...getInputProps()}
                        className="sr-only"
                        aria-label="Upload file"
                    />
                    {previewUrl ? (
                        <div className="absolute inset-0">
                            <img
                                src={previewUrl}
                                alt={files[0]?.file?.name || "Uploaded image"}
                                className="size-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-y-2.5">
                            <div
                                className="flex size-[60px] shrink-0 items-center justify-center rounded-[8px] border border-primary-100 border-dashed bg-primary-00"
                                aria-hidden="true"
                            >
                                <Image className="size-5 stroke-primary-400" />
                            </div>
                            <div className="text-center">
                                <p className="mb-1.5 text-sm">Upload banner</p>
                                <p className="text-primary-400 text-sm">
                                    SVG, PNG, JPG or GIF (max. 400x400px)
                                </p>
                                {uploadState.isUploading &&
                                    uploadState.uploadProgress.coverImage > 0 && (
                                        <div className="mt-2">
                                            <div className="text-xs text-primary-600 mb-1">
                                                Uploading banner...
                                            </div>
                                            <div className="w-full bg-primary-100 rounded-full h-2">
                                                <div
                                                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${uploadState.uploadProgress.coverImage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                {uploadState.coverImageUrl && (
                                    <div className="text-xs text-green-600 mt-1">
                                        ✓ Banner uploaded successfully
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {previewUrl && (
                    <div className="absolute top-4 right-4">
                        <button
                            type="button"
                            className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            onClick={() => removeFile(files[0]?.id)}
                            aria-label="Remove image"
                        >
                            <XIcon className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>
            {errors.length > 0 && (
                <div
                    className="flex items-center gap-1 text-destructive text-xs"
                    role="alert"
                >
                    <AlertCircleIcon className="size-3 shrink-0" />
                    <span>{errors[0]}</span>
                </div>
            )}
        </div>
    );
}