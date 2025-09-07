import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Link2, Loader2, Loader, Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { userQueries, hubQueries } from "@/lib/queries";
import {
  useCreateServiceConnectionMutation,
  useCreateSecretSharingMutation,
  useCreateWalletMutation,
} from "@/lib/mutations";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { ServiceClient } from "@/types/auth";
import type { Permission } from "@/types";
import { getScopeDisplayName } from "@/lib/scope-definitions";
import { Icon } from "@/components/ui/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { transformScopeDefinitions } from "@/lib/scope-utils";

const BLOCKCHAIN_OPTIONS = {
  EVM: {
    label: "EVM",
    chains: {
      "Ethereum": "evm:eip155:1",
      "Polygon": "evm:eip155:137",
      "Hyperliquid": "evm:eip155:999",
      "Base": "evm:eip155:8453",
      "Arbitrum": "evm:eip155:42161"
    }
  },
  SVM: {
    label: "SVM",
    chains: {
      "Solana Mainnet": "solana:mainnet-beta"
    }
  }
};

interface AuthMethodDialogProps {
  method: ServiceClient;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'connect' | 'callback';
  callbackData?: {
    success: boolean;
    connectionId?: string;
  };
  trigger?: React.ReactNode;
  onSuccess?: (connectionId: string, serviceName: string) => void;
}

export function AuthMethodDialog({
  method,
  open,
  onOpenChange,
  mode = 'connect',
  callbackData,
  trigger,
  onSuccess
}: AuthMethodDialogProps) {
  if (!method) {
    return null;
  }


  const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
  const [authHubName, setAuthHubName] = useState(
    method.type === 'embedded_wallet' ? `${method.name} wallet` : `${method.name} connection`
  );
  const [secretData, setSecretData] = useState<Record<string, any>>({});
  const [walletData, setWalletData] = useState<{
    accounts: Array<{
      chains: string[];
      pathFormat: string;
      path: string;
      curve: string;
      addressFormat: string;
    }>;
  }>({
    accounts: [
      {
        chains: ['evm:eip155:1'],
        pathFormat: '',
        path: '',
        curve: '',
        addressFormat: ''
      }
    ]
  });

  const [connectionState, setConnectionState] = useState<{
    status: 'idle' | 'connecting' | 'success' | 'error';
    error?: string;
    connectionId?: string;
  }>({ status: 'idle' });

  const createServiceConnection = useCreateServiceConnectionMutation();
  const createSecretSharing = useCreateSecretSharingMutation();
  const createWallet = useCreateWalletMutation();
  const { isAuthenticated } = useAuth();
  const { data: user } = useQuery(userQueries.meOptions(isAuthenticated));

  const { data: connectionData, isLoading: isLoadingConnection, error: _connectionError } = useQuery({
    ...hubQueries.userAuthConnectionOptions(callbackData?.connectionId || ''),
    enabled: mode === 'callback' && !!callbackData?.connectionId
  });

  const navigate = useNavigate();

  // Handle OAuth success callback and auto-close
  useEffect(() => {
    if (mode === 'callback' && callbackData?.success && connectionData && onSuccess) {
      const connId = callbackData.connectionId || 'connected';
      onSuccess(connId, method.name);
      setTimeout(() => {
        onOpenChange?.(false);
      }, 1500);
    }
  }, [mode, callbackData?.success, connectionData, onSuccess, method.name, onOpenChange, callbackData?.connectionId]);

  const getDefaultValuesForChain = (chainValue: string) => {
    if (chainValue.startsWith('evm:')) {
      return {
        pathFormat: 'PATH_FORMAT_BIP32',
        path: "m/44'/60'/0'/0/0",
        curve: 'CURVE_SECP256K1',
        addressFormat: 'ADDRESS_FORMAT_ETHEREUM'
      };
    } else if (chainValue.startsWith('solana:')) {
      return {
        pathFormat: 'PATH_FORMAT_BIP32',
        path: "m/44'/501'/0'/0'",
        curve: 'CURVE_ED25519',
        addressFormat: 'ADDRESS_FORMAT_SOLANA'
      };
    }
    return {
      pathFormat: '',
      path: '',
      curve: '',
      addressFormat: ''
    };
  };

  // Function to validate chain selection (prevent mixing EVM and SVM)
  const validateChainSelection = (newChain: string, existingChains: string[]) => {
    const isEVM = newChain.startsWith('evm:');
    const isSVM = newChain.startsWith('solana:');

    for (const existingChain of existingChains) {
      const existingIsEVM = existingChain.startsWith('evm:');
      const existingIsSVM = existingChain.startsWith('solana:');

      if ((isEVM && existingIsSVM) || (isSVM && existingIsEVM)) {
        return false; // Cannot mix EVM and SVM chains
      }
    }
    return true;
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);

    if (!isOpen) {
      setConnectionState({ status: 'idle' });

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('success');
      currentUrl.searchParams.delete('state');
      navigate({ to: currentUrl.pathname + currentUrl.search, replace: true });
    }
  };

  const handleSaveAuthenticator = async () => {
    try {
      setConnectionState({ status: 'connecting' });

      switch (method.type) {
        case 'oauth':
          if (Object.keys(method.scopeDefinitions).length > 0 && selectedScopes.length === 0) {
            toast.error("Please select at least one permission");
            setConnectionState({ status: 'idle' });
            return;
          }
          await createServiceConnection.mutateAsync({
            serviceClientName: method?.name || 'oauth',
            scopes: selectedScopes.map(scope => scope.id),
            name: authHubName,
            redirectUri: window.location.href
          });
          break;

        case 'secret_sharing':
          const metadata = method.metadata;
          if (metadata?.required) {
            for (const field of metadata.required) {
              if (!secretData[field]) {
                toast.error(`${metadata.properties?.[field]?.title || field} is required`);
                setConnectionState({ status: 'idle' });
                return;
              }
            }
          }
          const secretResult = await createSecretSharing.mutateAsync({
            serviceClientId: method.clientId,
            name: authHubName,
            secret: secretData
          });
          const secretConnectionId = secretResult?.[0]?.id || 'created';
          setConnectionState({
            status: 'success',
            connectionId: secretConnectionId
          });
          toast.success("Database connection created successfully!");

          // Call onSuccess callback and auto-close
          if (onSuccess) {
            onSuccess(secretConnectionId, method.name);
            setTimeout(() => {
              onOpenChange?.(false);
            }, 1500);
          }
          break;

        case 'embedded_wallet':
          if (!authHubName.trim()) {
            toast.error("Authentication Hub Name is required");
            setConnectionState({ status: 'idle' });
            return;
          }
          if (!walletData.accounts[0]?.chains[0] || walletData.accounts[0].chains[0].trim() === '') {
            toast.error("At least one blockchain chain is required");
            setConnectionState({ status: 'idle' });
            return;
          }

          // Process accounts with default values based on chain types
          const processedAccounts = walletData.accounts
            .filter(account => account.chains.some(chain => chain.trim() !== ''))
            .map(account => {
              // Get the first chain to determine defaults
              const firstChain = account.chains.find(chain => chain.trim() !== '');
              const defaults = getDefaultValuesForChain(firstChain || '');

              return {
                ...account,
                pathFormat: account.pathFormat || defaults.pathFormat,
                path: account.path || defaults.path,
                curve: account.curve || defaults.curve,
                addressFormat: account.addressFormat || defaults.addressFormat
              };
            });

          const walletResult = await createWallet.mutateAsync({
            name: authHubName,
            accounts: processedAccounts
          });
          const walletConnectionId = walletResult?.[0]?.id || 'created';
          setConnectionState({
            status: 'success',
            connectionId: walletConnectionId
          });
          toast.success("Wallet created successfully!");

          // Call onSuccess callback and auto-close
          if (onSuccess) {
            onSuccess(secretConnectionId, method.name);
            setTimeout(() => {
              onOpenChange?.(false);
            }, 1500);
          }
          break;

        default:
          toast.error("Unknown authentication type");
          setConnectionState({ status: 'idle' });
          return;
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      const errorMessage = error?.message || "Failed to create connection";
      setConnectionState({ status: 'error', error: errorMessage });
      toast.error(errorMessage);
    }
  };

  const isPending = createServiceConnection.isPending || createSecretSharing.isPending || createWallet.isPending || connectionState.status === 'connecting';

  const renderOAuthForm = () => (
    <>
      {Object.keys(method.scopeDefinitions).length > 0 ? (
        <PermissionSelector
          context="auth-method-dialog"
          key={`auth-method-dialog-${method.clientId}`}
          permissions={Object.entries(transformScopeDefinitions(method.name, method.scopeDefinitions)).map(([scope, label]) => ({
            id: scope,
            label: getScopeDisplayName(scope) || (label as string) || scope
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
      <div className="space-y-4">
        <Label className="text-sm font-medium">
          Accounts <span className="text-red-500">*</span>
        </Label>

        <ScrollArea className="h-[300px] w-full">
          <div className="space-y-4 pr-4">
            {walletData.accounts.map((account, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Account {index + 1}</Label>
                  {walletData.accounts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setWalletData(prev => ({
                        ...prev,
                        accounts: prev.accounts.filter((_, i) => i !== index)
                      }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Blockchain Chains <span className="text-red-500">*</span>
                  </Label>

                  {/* Display selected chains */}
                  {account.chains.length > 0 && account.chains[0] !== '' && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {account.chains.map((chainValue, chainIndex) => {
                        // Find the display name for this chain value
                        const displayName = Object.entries(BLOCKCHAIN_OPTIONS).reduce((found, [groupKey, group]) => {
                          if (found) return found;
                          const chainName = Object.entries(group.chains).find(([name, value]) => value === chainValue)?.[0];
                          return chainName || found;
                        }, '');

                        return (
                          <div key={chainIndex} className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs">
                            <span>{displayName || chainValue}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-primary-500 hover:text-primary-700"
                              onClick={() => setWalletData(prev => ({
                                ...prev,
                                accounts: prev.accounts.map((acc, i) =>
                                  i === index
                                    ? { ...acc, chains: acc.chains.filter((_, ci) => ci !== chainIndex) }
                                    : acc
                                )
                              }))}
                            >
                              ×
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Chain selector */}
                  <Select
                    onValueChange={(value) => {
                      if (value && !account.chains.includes(value)) {
                        // Validate chain selection
                        const currentChains = account.chains.filter(chain => chain.trim() !== '');
                        if (!validateChainSelection(value, currentChains)) {
                          toast.error("Cannot mix EVM and SVM chains in the same account");
                          return;
                        }

                        // Get default values for the new chain
                        const defaults = getDefaultValuesForChain(value);

                        setWalletData(prev => ({
                          ...prev,
                          accounts: prev.accounts.map((acc, i) =>
                            i === index
                              ? {
                                ...acc,
                                chains: acc.chains[0] === '' ? [value] : [...acc.chains, value],
                                // Set default values if they're empty
                                pathFormat: acc.pathFormat || defaults.pathFormat,
                                path: acc.path || defaults.path,
                                curve: acc.curve || defaults.curve,
                                addressFormat: acc.addressFormat || defaults.addressFormat
                              }
                              : acc
                          )
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blockchain chains" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BLOCKCHAIN_OPTIONS).map(([groupKey, group]) => (
                        <SelectGroup key={groupKey}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {Object.entries(group.chains).map(([chainName, chainValue]) => {
                            const currentChains = account.chains.filter(chain => chain.trim() !== '');
                            const isIncompatible = !validateChainSelection(chainValue, currentChains);

                            return (
                              <SelectItem
                                key={chainValue}
                                value={chainValue}
                                disabled={account.chains.includes(chainValue) || isIncompatible}
                              >
                                {chainName}
                                {isIncompatible && currentChains.length > 0 && (
                                  <span className="text-xs text-red-500 ml-1">(incompatible)</span>
                                )}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-primary-400">
                    Select one or more blockchain networks for this account. You cannot mix EVM and SVM chains.
                  </p>
                  {/* {account.chains.some(chain => chain.trim() !== '') && (
                    <div className="text-xs text-primary-300">
                      {(() => {
                        const chains = account.chains.filter(chain => chain.trim() !== '');
                        const hasEVM = chains.some(chain => chain.startsWith('evm:'));
                        const hasSVM = chains.some(chain => chain.startsWith('solana:'));

                        if (hasEVM && hasSVM) {
                          return <span className="text-red-500">⚠️ Cannot mix EVM and SVM chains</span>;
                        } else if (hasEVM) {
                          return <span className="text-green-500">✓ EVM chains selected</span>;
                        } else if (hasSVM) {
                          return <span className="text-green-500">✓ SVM chains selected</span>;
                        }
                        return null;
                      })()}
                    </div>
                  )} */}
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value={`advanced-${index}`}>
                    <AccordionTrigger className="p-0">Advanced Settings</AccordionTrigger>
                    <AccordionContent className="mt-4 flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`curve-${index}`} className="text-sm font-medium">Curve</Label>
                          <select
                            id={`curve-${index}`}
                            value={account.curve}
                            onChange={(e) => setWalletData(prev => ({
                              ...prev,
                              accounts: prev.accounts.map((acc, i) =>
                                i === index ? { ...acc, curve: e.target.value } : acc
                              )
                            }))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select curve (optional)</option>
                            <option value="CURVE_SECP256K1">SECP256K1 (Ethereum/Bitcoin)</option>
                            <option value="CURVE_ED25519">ED25519 (Solana)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`addressFormat-${index}`} className="text-sm font-medium">Address Format</Label>
                          <select
                            id={`addressFormat-${index}`}
                            value={account.addressFormat}
                            onChange={(e) => setWalletData(prev => ({
                              ...prev,
                              accounts: prev.accounts.map((acc, i) =>
                                i === index ? { ...acc, addressFormat: e.target.value } : acc
                              )
                            }))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select address format (optional)</option>
                            <option value="ADDRESS_FORMAT_ETHEREUM">Ethereum</option>
                            <option value="ADDRESS_FORMAT_SOLANA">Solana</option>
                            <option value="ADDRESS_FORMAT_BITCOIN">Bitcoin</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`path-${index}`} className="text-sm font-medium">Derivation Path</Label>
                        <Input
                          id={`path-${index}`}
                          placeholder="e.g., m/44'/60'/0'/0/0 (optional)"
                          value={account.path}
                          onChange={(e) => setWalletData(prev => ({
                            ...prev,
                            accounts: prev.accounts.map((acc, i) =>
                              i === index ? { ...acc, path: e.target.value } : acc
                            )
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`pathFormat-${index}`} className="text-sm font-medium">Path Format</Label>
                        <select
                          id={`pathFormat-${index}`}
                          value={account.pathFormat}
                          onChange={(e) => setWalletData(prev => ({
                            ...prev,
                            accounts: prev.accounts.map((acc, i) =>
                              i === index ? { ...acc, pathFormat: e.target.value } : acc
                            )
                          }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select path format (optional)</option>
                          <option value="PATH_FORMAT_BIP32">BIP32</option>
                        </select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => setWalletData(prev => ({
                ...prev,
                accounts: [...prev.accounts, {
                  chains: ['evm:eip155:1'], // Default to Ethereum
                  pathFormat: '',
                  path: '',
                  curve: '',
                  addressFormat: ''
                }]
              }))}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </ScrollArea>
      </div>
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
        <div className="flex items-center justify-between">
          <AlertDialogTitle className="font-normal text-base text-primary-400 capitalize">
            Connect {method.name}
          </AlertDialogTitle>
          <AlertDialogCancel asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </AlertDialogCancel>
        </div>
      </AlertDialogHeader>
      <div className="w-full">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex">
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={user?.profileImageUrl} alt={user?.name || 'User'} />
                <AvatarFallback className="rounded-sm">
                  {user ? getInitials(user.name) : 'U'}
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
                  {user?.name || 'User'}
                </span>
                <span className="text-primary-300 text-xs">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
            </div>
            {/* <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div> */}
          </div>

          <div className="flex flex-col space-y-1.5 px-4 text-[13px] text-primary-400">
            <label htmlFor="auth_hub_name">Authentication Hub Name</label>
            <Input
              type="text"
              value={authHubName}
              onChange={(e) => setAuthHubName(e.target.value)}
              placeholder={`${method.name} connection`}
            />
          </div>

          <div className="border-t border-t-primary-200 border-dashed" />

          {isPending ? (
            <div className="w-full flex flex-col items-center justify-center py-12 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="flex items-center justify-center gap-2">
                  Connecting
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-xs">O</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-xs">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {method.name}
                </h3>
                <span className="text-sm text-primary-400">
                  {method.type === 'oauth' ? 'Review the pop-up and connect' : 'Creating connection...'}
                </span>
              </div>

              <div className="flex items-center w-full relative max-w-[294px]">
                <div className="flex z-20 w-full items-center justify-between">
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-lg font-bold">O</AvatarFallback>
                  </Avatar>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-primary-600/15 rounded-[6px] text-primary-400 p-1 bg-primary-50">
                    <Loader2 className="size-3 animate-spin" />
                    Connecting
                  </div>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-lg font-bold">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
      {(isPending || connectionState.status === 'success' || connectionState.status === 'error') ? (
        connectionState.status === 'error' ? (
          <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-between">
            <AlertDialogCancel
              className="bg-primary-50"
              onClick={() => {
                setConnectionState({ status: 'idle' });
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="inset-shadow-search-btn"
              onClick={(e) => {
                e.preventDefault();
                setConnectionState({ status: 'idle' });
              }}
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        ) : null
      ) : (
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
          <div className="flex items-center justify-between">
            <AlertDialogTitle className="font-normal text-base text-primary-400 capitalize">
              Connect {method.name}
            </AlertDialogTitle>
            <button
              onClick={() => handleDialogOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </AlertDialogHeader>

        <div className="w-full">
          <div className="flex items-center justify-between px-4">
            <div className="flex">
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={user?.profileImageUrl} alt={user?.name || 'User'} />
                <AvatarFallback className="rounded-sm">
                  {user ? getInitials(user.name) : 'U'}
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
                  {user?.name || 'User'}
                </span>
                <span className="text-primary-300 text-xs">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
            </div>
            {/* <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div> */}
          </div>

          <div className="flex flex-col space-y-1.5 mt-6 px-4 text-[13px] text-primary-400">
            <label htmlFor="auth_hub_name">Authentication Hub Name</label>
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
            <div className="w-full flex flex-col items-center justify-center py-12 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="flex items-center justify-center gap-2">
                  Connecting
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-xs">O</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-xs">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {method.name}
                </h3>
                <span className="text-sm text-primary-400">Review the pop-up and connect {method.name}</span>
              </div>

              <div className="flex items-center w-full relative max-w-[294px]">
                <div className="flex z-20 w-full items-center justify-between">
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-lg font-bold">O</AvatarFallback>
                  </Avatar>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-primary-600/15 rounded-[6px] text-primary-400 p-1 bg-primary-50">
                    <Loader className="size-3" />
                    Connecting
                  </div>
                  <div className="bg-primary-600/20 w-full h-0.5" />
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-lg font-bold">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          ) : isSuccess && connectionData ? (
            <div className="w-full flex flex-col items-center justify-center py-12 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="flex items-center justify-center gap-2">
                  Connected
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-xs">O</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-xs">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {method.name}
                </h3>
                <span className="text-sm text-primary-400">Successfully connected to {method.name}</span>
              </div>
              <div className="flex items-center w-full relative max-w-[294px]">
                <div className="flex z-20 w-full items-center justify-between">
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-lg font-bold">O</AvatarFallback>
                  </Avatar>
                  <div className="bg-success-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-success-600/15 rounded-[6px] text-success-600 p-1 bg-success-50">
                    <Link2 className="-rotate-45 size-4" />
                    Connected
                  </div>
                  <div className="bg-success-600/20 w-full h-0.5" />
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-lg font-bold">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>

          ) : (
            <div className="w-full flex flex-col items-center justify-center py-12 text-[18px]">
              <div className="flex flex-col text-center mb-8">
                <h3 className="flex items-center justify-center gap-2">
                  Connection Failed
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-xs">O</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-[18px] rounded-sm">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-xs">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {method.name}
                </h3>
                <span className="text-sm text-primary-400">Failed to connect to {method.name}</span>
              </div>
              <div className="flex items-center w-full relative max-w-[294px]">
                <div className="flex z-20 w-full items-center justify-between">
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src="/logo.png" alt="Osiris" />
                    <AvatarFallback className="text-lg font-bold">O</AvatarFallback>
                  </Avatar>
                  <div className="bg-warning-600/20 w-full h-0.5" />
                  <div className="h-fit text-xs border flex items-center gap-1 border-warning-600/15 rounded-[6px] text-warning-600 p-1 bg-warning-50">
                    <Icon name="warning" />
                    Error
                  </div>
                  <div className="bg-warning-600/20 w-full h-0.5" />
                  <Avatar className="size-14 rounded-[6px]">
                    <AvatarImage src={method.iconUrl || undefined} alt={method.name} />
                    <AvatarFallback className="text-lg font-bold">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
      <AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100 p-0">
          {renderCallbackMode()}
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
      )}
      {!trigger && (
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-fit items-center gap-1 rounded-[6px] bg-badge-success px-2 py-1 font-medium text-badge-success-text text-xs"
          >
            <Link2 /> Connect
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100 p-0">
        {renderConnectMode()}
      </AlertDialogContent>
    </AlertDialog>
  );
}
