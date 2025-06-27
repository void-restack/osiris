import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ChevronDown } from "lucide-react";


type McpVersion = {
    version: string;
    id: number;
}

export function McpVersions({ versions }: { versions: McpVersion[] }) {
    const [selectedVersion, setSelectedVersion] = useState<McpVersion | null>(null);
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="secondary">
                Versions {selectedVersion?.version}
                <ChevronDown className="w-4 h-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {versions.map((version) => (
                <DropdownMenuItem key={version.id} onClick={() => setSelectedVersion(version)}>
                    <p>{version.version}</p>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
}
