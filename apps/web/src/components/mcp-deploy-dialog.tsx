import { useState } from "react";
import { X, Copy, ExternalLink, HelpCircle } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/original-tabs";
import { packageQueries } from "@/lib/queries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PackageWithUserStatus } from "@/types";

interface McpDeployDialogProps {
  package: PackageWithUserStatus;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}


export function McpDeployDialog({
  package: pkg,
  trigger,
  open,
  onOpenChange
}: McpDeployDialogProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(pkg.packageId));
  const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(pkg.packageId));

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const publisherUsername = 
    authScopes?.publisher?.username || 
    authScopes?.publisher?.name || 
    '';
  const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BASE_URL || 'https://osiris-gateway.staging.osirislabs.xyz';
  const mcpUrl =  `${gatewayBaseUrl}/@${publisherUsername}/${pkg.name}`
  
  const requiresAuth = (authScopes?.serviceClients?.length || 0) > 0;
  const authServices = authScopes?.serviceClients?.map((sc: any) => sc.name).join(', ') || '';

  const handleClose = () => {
    onOpenChange?.(false);
    setTimeout(() => {
      setCopiedText(null);
    }, 100);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      View URL
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-[520px] rounded-[12px] border-primary-100 p-0">
        <AlertDialogHeader className="border-b border-b-primary-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <AlertDialogTitle className="font-normal text-base text-primary-400">
              {pkg.name} MCP URL
            </AlertDialogTitle>
            {requiresAuth && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      This MCP requires authentication: {authServices}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </AlertDialogHeader>

        <div className="w-full max-h-[calc(100vh-200px)] overflow-y-scroll">
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="flex">
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={pkg.iconUrl ?? ""} alt={pkg.name} />
                <AvatarFallback className="rounded-sm text-white font-bold">
                  {pkg.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 flex flex-col">
                <span className="text-primary-800 text-sm">{pkg.name}</span>
                <span className="text-primary-300 text-xs">{pkg.shortDescription || 'MCP Package'}</span>
              </div>
            </div>
          </div>

          {/* MCP URL Display */}
          <div className="px-4 pt-6 pb-4">
            <Label className="text-[13px] text-primary-400 mb-2 block">MCP Server URL</Label>
            <div className="p-2 bg-gray-100 rounded-[6px] relative">
              <code className="text-xs break-all">{mcpUrl}</code>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => copyToClipboard(mcpUrl, 'MCP URL')}
              >
                <Copy className="size-3" />
              </Button>
            </div>
            {requiresAuth && (
              <p className="text-xs text-primary-400 mt-2">
                ⚠️ This MCP requires authentication. You'll need to configure auth when connecting.
              </p>
            )}
          </div>

          <div className="border-t border-t-primary-200 border-dashed my-4" />

          <Tabs defaultValue="cursor" className="w-full px-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
              <TabsTrigger value="vscode">VS Code</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>

            <TabsContent value="cursor" className="space-y-4">
              <div className="text-sm">
                <h4 className="font-medium mb-2">One-click install in Cursor</h4>
                <Button
                  onClick={() => {
                    const configObj = {
                      type: "http",
                      url: mcpUrl
                    };
                    const cursorUrl = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(pkg.name)}&config=${encodeURIComponent(btoa(JSON.stringify(configObj)))}`;
                    window.open(cursorUrl, '_blank');
                  }}
                  className="w-full mb-2"
                >
                  <ExternalLink className="size-4 mr-2" />
                  Install in Cursor
                </Button>
                <p className="text-xs text-primary-400">
                  This will open Cursor and automatically add the MCP server to your configuration.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="claude" className="space-y-4">
              <div className="text-sm space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Claude Desktop</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Find "Add Connector" in the chat bar</li>
                    <li>Click on "Add Custom Connector" in the "Manage connector" page</li>
                    <li>Enter the MCP URL and name:</li>
                  </ol>
                  <div className="mt-2 p-2 bg-gray-100 rounded-[6px] relative">
                    <code className="text-xs break-all">{mcpUrl}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => copyToClipboard(mcpUrl, 'MCP URL')}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Claude Code</h4>
                  <div className="p-2 bg-gray-100 rounded-[6px] relative">
                    <code className="text-xs break-all">claude mcp add --transport http {pkg.name} -s user "{mcpUrl}"</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => copyToClipboard(`claude mcp add --transport http ${pkg.name} -s user "${mcpUrl}"`, 'Claude Code command')}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vscode" className="space-y-4">
              <div className="text-sm">
                <h4 className="font-medium mb-2">One-click install in VS Code</h4>
                <Button
                  onClick={() => {
                    const configObj = {
                      name: pkg.name,
                      type: "http",
                      url: mcpUrl
                    };
                    const vscodeUrl = `vscode:mcp/install?${encodeURIComponent(JSON.stringify(configObj))}`;
                    window.open(vscodeUrl, '_blank');
                  }}
                  className="w-full mb-2"
                >
                  <ExternalLink className="size-4 mr-2" />
                  Install in VS Code
                </Button>
                <p className="text-xs text-primary-400">
                  This will open VS Code and automatically add the MCP server to your configuration.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 overflow-hidden">
              <div className="text-sm">
                <h4 className="font-medium mb-2">MCP Configuration</h4>
                <p className="text-xs text-primary-400 mb-2">Add this to your MCP configuration file:</p>
                <div className="p-3 bg-gray-100 rounded-[6px] relative">
                  <pre className="text-xs text-wrap">
                    {`{
  "mcpServers": {
    "${pkg.name}": {
      "type": "streamable-http",
      "url": "${mcpUrl}"
    }
  }
}`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`{
  "mcpServers": {
    "${pkg.name}": {
      "type": "streamable-http",
      "url": "${mcpUrl}"
    }
  }
}`, 'JSON configuration')}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4 overflow-hidden">
              <div className="text-sm">
                <h4 className="font-medium mb-2">TypeScript Integration</h4>
                <p className="text-xs text-primary-400 mb-2">Use this code to connect programmatically:</p>
                <div className="p-3 bg-gray-100 rounded-[6px] relative max-h-64 overflow-y-auto">
                  <pre className="text-xs text-wrap">
                    {`import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

// Connect to MCP server
const serverUrl = "${mcpUrl}"

const transport = new StreamableHTTPClientTransport(serverUrl)

// Create MCP client
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

const client = new Client({
  name: "My Osiris Client",
  version: "1.0.0"
})
await client.connect(transport)

// List available tools
const tools = await client.listTools()
console.log(\`Available tools: \${tools.map(t => t.name).join(", ")}\`)`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

// Connect to MCP server
const serverUrl = "${mcpUrl}"

const transport = new StreamableHTTPClientTransport(serverUrl)

// Create MCP client
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

const client = new Client({
  name: "My Osiris Client",
  version: "1.0.0"
})
await client.connect(transport)

// List available tools
const tools = await client.listTools()
console.log(\`Available tools: \${tools.map(t => t.name).join(", ")}\`)`, 'TypeScript code')}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <AlertDialogFooter className="flex w-full items-center justify-end rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-2">
          <AlertDialogCancel onClick={handleClose} className="gap-2">
            <X className="size-4" />
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}