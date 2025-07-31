import { useState } from "react";
import { Link2, RefreshCcw, Loader2, Loader } from "lucide-react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionSelector } from "@/components/ui/permission-selector";
// import { Badge } from "@/components/ui/badge";
import { userQueries, hubQueries } from "@/lib/queries";
import {
  useCreateServiceConnectionMutation,
  useCreateSecretSharingMutation,
  useCreateWalletMutation
} from "@/lib/mutations";
import { getInitials } from "@/lib/utils";
import type { ServiceClient } from "@/types/auth";
import type { Permission } from "@/types";
import { Icon } from "@/components/ui/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AuthMethodDialogProps {
  method: ServiceClient;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'connect' | 'callback';
  callbackData?: {
    success: boolean;
    connectionId?: string;
  };
}

export function AuthMethodDialog({
  method,
  open,
  onOpenChange,
  mode = 'connect',
  callbackData
}: AuthMethodDialogProps) {
  const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
  const [authHubName, setAuthHubName] = useState(`${method.name} connection`);
  const [secretData, setSecretData] = useState<Record<string, any>>({});
  const [walletData, setWalletData] = useState({
    chain: '',
    options: { curve: '', path: '' },
    policy: {}
  });

  const createServiceConnection = useCreateServiceConnectionMutation();
  const createSecretSharing = useCreateSecretSharingMutation();
  const createWallet = useCreateWalletMutation();
  const { data: user } = useSuspenseQuery(userQueries.meOptions());

  const { data: connectionData, isLoading: isLoadingConnection, error: _connectionError } = useQuery({
    ...hubQueries.userAuthConnectionOptions(callbackData?.connectionId || ''),
    enabled: mode === 'callback' && !!callbackData?.connectionId
  });

  const handleSaveAuthenticator = async () => {
    try {
      switch (method.type) {
        case 'oauth':
          if (Object.keys(method.scopeDefinitions).length > 0 && selectedScopes.length === 0) {
            toast.error("Please select at least one permission");
            return;
          }
          await createServiceConnection.mutateAsync({
            serviceClientName: method?.name || 'oauth',
            scopes: selectedScopes.map(scope => scope.id),
            name: authHubName
          });
          break;

        case 'secret_sharing':
          // Validate required fields
          const metadata = method.metadata;
          if (metadata?.required) {
            for (const field of metadata.required) {
              if (!secretData[field]) {
                toast.error(`${metadata.properties?.[field]?.title || field} is required`);
                return;
              }
            }
          }
          await createSecretSharing.mutateAsync({
            serviceClientId: method.clientId,
            secret: secretData
          });
          break;

        case 'embedded_wallet':
          if (!walletData.chain) {
            toast.error("Chain is required");
            return;
          }
          await createWallet.mutateAsync({
            chain: walletData.chain,
            options: walletData.options,
            policy: walletData.policy
          });
          break;

        default:
          toast.error("Unknown authentication type");
          return;
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to start authentication process");
    }
  };

  const isPending = createServiceConnection.isPending || createSecretSharing.isPending || createWallet.isPending;

  const renderOAuthForm = () => (
    <>
      {Object.keys(method.scopeDefinitions).length > 0 ? (
        <PermissionSelector
          permissions={Object.entries(method.scopeDefinitions).map(([scope, label]) => ({
            id: scope,
            label: label
          }))}
          placeholder="Search permissions..."
          onSelectionChange={setSelectedScopes}
        />
      ) : (
        null
      )}
    </>
  );

  const renderSecretSharingForm = () => {
    const metadata = method.metadata;
    if (!metadata?.properties) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">No configuration fields available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(metadata.properties).map(([fieldKey, fieldConfig]: [string, any]) => (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey} className="text-sm font-medium">
              {fieldConfig.title || fieldKey}
              {metadata.required?.includes(fieldKey) && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Input
              id={fieldKey}
              type={fieldConfig.format === 'uri' ? 'url' : 'text'}
              placeholder={fieldConfig.description || `Enter ${fieldConfig.title || fieldKey}`}
              value={secretData[fieldKey] || ''}
              onChange={(e) => setSecretData(prev => ({
                ...prev,
                [fieldKey]: e.target.value
              }))}
              required={metadata.required?.includes(fieldKey)}
            />
            {fieldConfig.description && (
              <p className="text-xs text-primary-400">{fieldConfig.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWalletForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chain" className="text-sm font-medium">
          Blockchain Network <span className="text-red-500">*</span>
        </Label>
        <Input
          id="chain"
          placeholder="e.g., ethereum, solana, bitcoin"
          value={walletData.chain}
          onChange={(e) => setWalletData(prev => ({
            ...prev,
            chain: e.target.value
          }))}
          required
        />
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="p-0">Advanced</AccordionTrigger>
          <AccordionContent className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="curve" className="text-sm font-medium">Curve (Optional)</Label>
              <Input
                id="curve"
                placeholder="e.g., secp256k1, ed25519"
                value={walletData.options.curve}
                onChange={(e) => setWalletData(prev => ({
                  ...prev,
                  options: { ...prev.options, curve: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="path" className="text-sm font-medium">Derivation Path (Optional)</Label>
              <Input
                id="path"
                placeholder="e.g., m/44'/0'/0'/0/0"
                value={walletData.options.path}
                onChange={(e) => setWalletData(prev => ({
                  ...prev,
                  options: { ...prev.options, path: e.target.value }
                }))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  const renderFormByType = () => {
    switch (method.type) {
      case 'oauth':
        return renderOAuthForm();
      case 'secret_sharing':
        return renderSecretSharingForm();
      case 'embedded_wallet':
        return renderWalletForm();
      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Unknown authentication type: {method.type}</p>
          </div>
        );
    }
  };

  const renderConnectMode = () => (
    <>
      <AlertDialogHeader className="border-b border-b-primary-100 px-4 py-3">
        <AlertDialogTitle className="font-normal text-base text-primary-400 capitalize">
          Connect {method.name}
        </AlertDialogTitle>
      </AlertDialogHeader>
      <div className="w-full">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex">
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback className="rounded-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Avatar className="-ml-3 rounded-lg size-10">
                <AvatarImage src={method.iconUrl || ``} alt={method.name} />
                <AvatarFallback className="rounded-sm">
                  {getInitials(method.name)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 flex flex-col">
                <span className="text-primary-800 text-sm">
                  {user.name}
                </span>
                <span className="text-primary-300 text-xs">
                  {user.email}
                </span>
              </div>
            </div>
            <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 px-4 text-[13px] text-primary-400">
            <label htmlFor="auth_hub_name">Auth Hub Name</label>
            <Input
              type="text"
              value={authHubName}
              onChange={(e) => setAuthHubName(e.target.value)}
              placeholder={`${method.name} connection`}
            />
          </div>

          <div className="border-t border-t-primary-200 border-dashed" />

          {isPending ? (
            <div className="w-full max-w-md flex flex-col items-center mt-20 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="inline">Connecting
                  <img src="" className="size-[18px] mx-2 inline" />
                  {method.name}</h3>
                <span className="text-sm text-primary-400">
                  {method.type === 'oauth' ? 'Review the pop-up and connect' : 'Creating connection...'}
                </span>
              </div>

              <div className="flex items-center w-full relative max-w-[294px]">
                <div className="flex z-20 w-full items-center justify-between">
                  <div className="bg-purple-400 rounded-[6px] w-full size-14"></div>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-primary-600/15 rounded-[6px] text-primary-400 p-1 bg-primary-50">
                    <Loader2 className="size-3 animate-spin" />
                    Connecting</div>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <div className="bg-green-400 w-full rounded-[6px] size-14"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col px-4">
              <div className="mb-4 flex flex-col">
                <span>
                  {method.type === 'oauth' ? 'Allow Access' :
                    method.type === 'secret_sharing' ? 'Configuration' :
                      'Wallet Setup'}
                </span>
                <span className="text-[13px] text-primary-300">
                  {method.type === 'oauth' ? 'Configure the data access for the MCPs' :
                    method.type === 'secret_sharing' ? 'Enter your connection details' :
                      'Configure your wallet parameters'}
                </span>
              </div>

              {renderFormByType()}
            </div>
          )}
        </div>
      </div>
      {isPending ? null : (
        <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-between">
          <AlertDialogCancel className="bg-primary-50">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="inset-shadow-search-btn"
            onClick={(e) => {
              e.preventDefault()
              handleSaveAuthenticator()
            }}
            disabled={isPending}
          >
            {isPending ? "Connecting..." :
              method.type === 'oauth' ? "Save Authenticator" :
                method.type === 'secret_sharing' ? "Save Configuration" :
                  "Create Wallet"}
          </AlertDialogAction>
        </AlertDialogFooter>
      )}
    </>
  );

  const renderCallbackMode = () => {
    const isSuccess = callbackData?.success;
    const isLoading = isLoadingConnection;
    // const hasError = connectionError || (!isSuccess && !isLoading);

    return (
      <>
        <AlertDialogHeader className="border-b border-b-primary-100 px-4 py-3">
          <AlertDialogTitle className="font-normal text-base text-primary-400 capitalize">
            Connect {method.name}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="w-full">
          <div className="flex items-center justify-between px-4">
            <div className="flex">
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback className="rounded-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Avatar className="-ml-3 rounded-lg size-10">
                <AvatarImage src={method.iconUrl || ``} alt={method.name} />
                <AvatarFallback className="rounded-sm">
                  {getInitials(method.name)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 flex flex-col">
                <span className="text-primary-800 text-sm">
                  {user.name}
                </span>
                <span className="text-primary-300 text-xs">
                  {user.email}
                </span>
              </div>
            </div>
            <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 mt-6 px-4 text-[13px] text-primary-400">
            <label htmlFor="auth_hub_name">Auth Hub Name</label>
            <Input
              type="text"
              disabled
              value={authHubName}
              onChange={(e) => setAuthHubName(e.target.value)}
              placeholder={`${method.name} connection`}
            />
          </div>

          <div className="border-t border-t-primary-200 border-dashed my-6" />

          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center mb-6 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="inline">Connecting
                  <img src="" className="size-[18px] mx-2 inline" />
                  {method.name.toWellFormed()}</h3>
                <span className="text-sm text-primary-400">Review the pop-up and connect {method.name}</span>
              </div>

              <div className="flex items-center w-full relative max-w-[294px]">
                {/* <div className="absolute w-full h-0.5 bg-gradient-to-r from-connector-line via-white to-connector-line z-10" /> */}
                <div className="flex z-20 w-full items-center justify-between">
                  <div className="bg-purple-400 rounded-[6px] w-full size-14"></div>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-primary-600/15 rounded-[6px] text-primary-400 p-1 bg-primary-50">
                    <Loader className="size-3" />
                    Connecting</div>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <div className="bg-green-400 w-full rounded-[6px] size-14"></div>
                </div>
              </div>
            </div>
          ) : isSuccess && connectionData ? (
            <div className="w-full flex flex-col items-center justify-center mb-6 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="inline">Connecting
                  <img src="#" className="size-[18px] mx-2 inline" />
                  {method.name.toWellFormed()}</h3>
                <span className="text-sm text-primary-400">Review the pop-up and connect {method.name}</span>
              </div>
              <div className="flex items-center w-full relative max-w-[294px]">
                {/* <div className="absolute w-full h-0.5 bg-gradient-to-r from-connector-line via-white to-connector-line z-10" /> */}
                <div className="flex z-20 w-full items-center justify-between">
                  <div className="bg-purple-400 rounded-[6px] w-full size-14"></div>
                  <div className="bg-success-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-success-600/15 rounded-[6px] text-success-600 p-1 bg-success-50">
                    <Link2 className="-rotate-45 size-4" />
                    Connected</div>
                  <div className="bg-success-600/20 w-full h-0.5" />
                  <div className="bg-green-400 w-full rounded-[6px] size-14"></div>
                </div>
              </div>
            </div>

          ) : (
            <div className="w-full flex flex-col items-center justify-center mb-6 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="inline">Connecting
                  <img src="" className="size-[18px] mx-2 inline" />
                  {method.name.toWellFormed()}</h3>
                <span className="text-sm text-primary-400">Review the pop-up and connect {method.name}</span>
              </div>
              <div className="flex items-center w-full relative max-w-[294px]">
                {/* <div className="absolute w-full h-0.5 bg-gradient-to-r from-connector-line via-white to-connector-line z-10" /> */}
                <div className="flex z-20 w-full items-center justify-between">
                  <div className="bg-purple-400 rounded-[6px] w-full size-14"></div>
                  <div className="bg-warning-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-warning-600/15 rounded-[6px] text-warning-600 p-1 bg-warning-50">
                    <Icon name="warning" />
                    Error</div>
                  <div className="bg-warning-600/20 w-full h-0.5" />
                  <div className="bg-green-400 w-full rounded-[6px] size-14"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  if (mode === 'callback') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100 p-0">
          {renderCallbackMode()}
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-fit items-center gap-1 rounded-[6px] bg-badge-success px-2 py-1 font-medium text-badge-success-text text-xs"
        >
          <Link2 /> Connect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100 p-0">
        {renderConnectMode()}
      </AlertDialogContent>
    </AlertDialog>
  );
}


{/* <div className="flex items-center justify-center py-4"> */ }
{/*   <div className="text-center space-y-2"> */ }
{/*     <CheckCircle className="size-12 text-green-500 mx-auto" /> */ }
{/*     <h3 className="font-medium text-primary-800">Connection Established!</h3> */ }
{/*     <p className="text-sm text-primary-400">You can now use this authentication method</p> */ }
{/*   </div> */ }
{/* </div> */ }

{/* <div className="border rounded-lg p-4 bg-green-50 space-y-3"> */ }
{/* <div className="flex items-center gap-3"> */ }
{/*   <Avatar className="size-8 rounded-lg"> */ }
{/*     <AvatarImage src={connectionData.metadata?.user?.picture || connectionData.metadata?.user?.avatar_url} /> */ }
{/*     <AvatarFallback className="rounded-sm text-xs"> */ }
{/*       {getInitials(connectionData.metadata?.user?.name || method.name)} */ }
{/*     </AvatarFallback> */ }
{/*   </Avatar> */ }
{/*   <div className="flex-1"> */ }
{/*     <p className="font-medium text-sm text-primary-800"> */ }
{/*       {connectionData.metadata?.user?.name || connectionData.name || `${method.name} Account`} */ }
{/*     </p> */ }
{/*     <p className="text-xs text-primary-400"> */ }
{/*       {connectionData.metadata?.user?.email || connectionData.uniqueId} */ }
{/*     </p> */ }
{/*   </div> */ }
{/*   <Badge variant="secondary" className="text-xs"> */ }
{/*     Connected */ }
{/*   </Badge> */ }
{/* </div> */ }

{/* {connectionData.scopes && connectionData.scopes.length > 0 && ( */ }
{/*   <div> */ }
{/*     <p className="text-xs text-primary-400 mb-2">Granted Permissions:</p> */ }
{/*     <div className="flex flex-wrap gap-1"> */ }
{/*       {connectionData.scopes.slice(0, 3).map((scope: string) => ( */ }
{/*         <Badge key={scope} variant="outline" className="text-xs"> */ }
{/*           {method.scopeDefinitions[scope] || scope} */ }
{/*         </Badge> */ }
{/*       ))} */ }
{/*       {connectionData.scopes.length > 3 && ( */ }
{/*         <Badge variant="outline" className="text-xs"> */ }
{/*           +{connectionData.scopes.length - 3} more */ }
{/*         </Badge> */ }
{/*       )} */ }
{/*     </div> */ }
{/*   </div> */ }
{/* )} */ }
{/* </div> */ }
