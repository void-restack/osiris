import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy } from "lucide-react";
import { useCreateOAuthClientMutation } from "@/lib/mutations";
import { toast } from "sonner";

export function CreateOAuthClientDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [redirectUris, setRedirectUris] = useState<string[]>(["http://localhost:3000/callback"]);
    const [newClientData, setNewClientData] = useState<any>(null);

    const createClientMutation = useCreateOAuthClientMutation();

    const handleAddRedirectUri = () => {
        setRedirectUris([...redirectUris, ""]);
    };

    const handleRemoveRedirectUri = (index: number) => {
        if (redirectUris.length > 1) {
            setRedirectUris(redirectUris.filter((_, i) => i !== index));
        }
    };

    const handleUpdateRedirectUri = (index: number, value: string) => {
        const updated = [...redirectUris];
        updated[index] = value;
        setRedirectUris(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Client name is required");
            return;
        }

        const validUris = redirectUris.filter(uri => uri.trim() !== "");
        if (validUris.length === 0) {
            toast.error("At least one redirect URI is required");
            return;
        }

        createClientMutation.mutate({
            name: name.trim(),
            redirectUris: validUris,
            metadata: description.trim() ? { description: description.trim() } : {},
        }, {
            onSuccess: (data) => {
                setNewClientData(data);
                // Don't close dialog immediately - show the client secret first
            }
        });
    };

    const handleClose = () => {
        setOpen(false);
        setName("");
        setDescription("");
        setRedirectUris(["http://localhost:3000/callback"]);
        setNewClientData(null);
    };

    const handleCopyClientId = () => {
        if (newClientData) {
            navigator.clipboard.writeText(newClientData.clientId);
            toast.success("Client ID copied to clipboard");
        }
    };

    const handleCopyClientSecret = () => {
        if (newClientData) {
            navigator.clipboard.writeText(newClientData.clientSecret);
            toast.success("Client secret copied to clipboard");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create OAuth Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                {!newClientData ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create OAuth Client</DialogTitle>
                            <DialogDescription>
                                Create a new OAuth client for your application. You'll receive a client ID and secret to use for authentication.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Client Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="My Application"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="A brief description of your application"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Redirect URIs *</Label>
                                    <div className="space-y-2">
                                        {redirectUris.map((uri, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    value={uri}
                                                    onChange={(e) => handleUpdateRedirectUri(index, e.target.value)}
                                                    placeholder="http://localhost:3000/callback"
                                                    required
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveRedirectUri(index)}
                                                    disabled={redirectUris.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddRedirectUri}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Redirect URI
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createClientMutation.isPending}>
                                    {createClientMutation.isPending ? "Creating..." : "Create Client"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>OAuth Client Created Successfully!</DialogTitle>
                            <DialogDescription>
                                Your OAuth client has been created. Please copy and store these credentials securely.
                                The client secret will not be shown again.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Client ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newClientData.clientId}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyClientId}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Client Secret</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newClientData.clientSecret}
                                        readOnly
                                        className="font-mono text-sm"
                                        type="password"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyClientSecret}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>Important:</strong> Store the client secret securely. You won't be able to see it again.
                                    If you lose it, you'll need to regenerate a new one.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose}>
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
