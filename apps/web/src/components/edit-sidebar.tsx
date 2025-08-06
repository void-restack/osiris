import { X, Eye, EyeOff, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import {
  type UserServiceConnection,
  type ConnectionFormData,
  connectionToFormData,
  isDatabaseConnection,
  isOAuthConnection,
  isWalletConnection,
  type OAuthFormData,
  type DatabaseFormData,
  type WalletFormData
} from "@/types/auth";
import { useCreateSecretSharingMutation, useCreateServiceConnectionMutation, useUpdateWalletMutation, useUpdateSecretSharingMutation, useAddWalletMutation } from "@/lib/mutations";
import { useQuery } from "@tanstack/react-query";
import { hubQueries } from "@/lib/queries";
import { PermissionSelector, type Permission } from "./ui/permission-selector";

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

export function EditConnectionSidebar() {
  const { selectedConnection, selectedServiceClient, closeEditSidebar, isEditSidebarOpen } = useAppStore();
  const [formData, setFormData] = useState<ConnectionFormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
  const [initialScopes, setInitialScopes] = useState<Permission[]>([]);
  const [showSecrets, setShowSecrets] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    chains: [] as string[],
    pathFormat: '',
    path: '',
    curve: '',
    addressFormat: ''
  });

  const createSecretSharingMutation = useCreateSecretSharingMutation();
  const createServiceConnectionMutation = useCreateServiceConnectionMutation();
  const updateWalletMutation = useUpdateWalletMutation();
  const updateSecretSharingMutation = useUpdateSecretSharingMutation();
  const addWalletMutation = useAddWalletMutation();

  useEffect(() => {
    if (selectedConnection) {
      setFormData(connectionToFormData(selectedConnection));
      setHasChanges(false);

      if (isOAuthConnection(selectedConnection) && selectedServiceClient?.scopeDefinitions) {
        const connectionScopes = selectedConnection.scopes.map(scope => ({
          id: scope,
          label: selectedServiceClient.scopeDefinitions[scope] || scope
        }));
        setSelectedScopes(connectionScopes);
        setInitialScopes(connectionScopes);
      }
    }
  }, [selectedConnection, selectedServiceClient]);

  const checkForChanges = (newFormData?: ConnectionFormData, newScopes?: Permission[]) => {
    if (!selectedConnection) return false;

    const currentFormData = newFormData || formData;
    const currentScopes = newScopes || selectedScopes;

    const formChanged = currentFormData ?
      JSON.stringify(currentFormData) !== JSON.stringify(connectionToFormData(selectedConnection)) :
      false;

    const scopeChanged = isOAuthConnection(selectedConnection) ?
      JSON.stringify(currentScopes) !== JSON.stringify(initialScopes) :
      false;

    return formChanged || scopeChanged;
  };

  const handleScopeChange = (scopes: Permission[]) => {
    setSelectedScopes(scopes);
    const hasChanges = checkForChanges(undefined, scopes);
    setHasChanges(hasChanges);
  };

  const handleInputChange = (field: string, value: any) => {
    if (formData) {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      if (selectedConnection) {
        const hasChanges = checkForChanges(newFormData);
        setHasChanges(hasChanges);
      }
    }
  };

  const handleSave = async () => {
    if (formData && hasChanges && selectedConnection) {
      try {
        if (isDatabaseConnection(selectedConnection)) {
          const dbFormData = formData as DatabaseFormData;
          await updateSecretSharingMutation.mutateAsync({
            id: selectedConnection.id,
            name: dbFormData.name || 'Database Connection',
            secret: {
              db_url: dbFormData.host, // The host field now contains the full db_url
            },
          });
        } else if (isOAuthConnection(selectedConnection)) {
          const scopeIds = selectedScopes.map(scope => scope.id);

          await createServiceConnectionMutation.mutateAsync({
            serviceClientName: selectedServiceClient?.name || 'oauth',
            scopes: scopeIds,
            name: formData.name,
            redirectUri: window.location.href
          });
        } else if (isWalletConnection(selectedConnection)) {
          // For wallet connections, only supported chains can be updated
          // Names and addresses are handled separately via different APIs
          toast.success("Wallet settings updated!");
        }

        setHasChanges(false);
        toast.success("Connection saved successfully!");
      } catch (error: any) {
        console.error("Error saving connection:", error);
        toast.error(error.message || "Failed to save connection");
      }
    }
  };

  const handleAddAddress = async () => {
    if (!selectedConnection || !isWalletConnection(selectedConnection)) return;

    if (newAddress.chains.length === 0) {
      toast.error("Please select at least one blockchain chain");
      return;
    }

    try {
      // Extract wallet metadata to get walletId and accountId
      const walletMetadata = selectedConnection.metadata;

      await addWalletMutation.mutateAsync({
        id: selectedConnection.id,
        walletId: walletMetadata?.id || '',
        accountId: walletMetadata?.accounts?.id || '',
        addresses: [newAddress]
      });

      // Reset the form
      setNewAddress({
        chains: [],
        pathFormat: '',
        path: '',
        curve: '',
        addressFormat: ''
      });
      setShowAddAddress(false);

      toast.success("Address added successfully!");
    } catch (error: any) {
      console.error("Error adding address:", error);
      toast.error(error.message || "Failed to add address");
    }
  };

  const handleCancelAddAddress = () => {
    setNewAddress({
      chains: [],
      pathFormat: '',
      path: '',
      curve: '',
      addressFormat: ''
    });
    setShowAddAddress(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm("Discard unsaved changes?");
      if (!confirmDiscard) return;
    }
    closeEditSidebar();
  };

  const getBreadcrumb = () => {
    if (!selectedServiceClient) return '';

    switch (selectedServiceClient.type) {
      case 'secret_sharing':
        return 'Postgres / ';
      case 'oauth':
        return `${selectedServiceClient.name} / `;
      case 'embedded_wallet':
        return 'Turnkey / ';
      default:
        return '';
    }
  };

  const getSaveButtonText = () => {
    if (!selectedServiceClient) return 'Save';

    switch (selectedServiceClient.type) {
      case 'secret_sharing':
        return 'Save Database';
      case 'oauth':
        return 'Save Connection';
      case 'embedded_wallet':
        return 'Save Wallet';
      default:
        return 'Save';
    }
  };

  if (!selectedConnection || !formData || !isEditSidebarOpen) {
    return null;
  }

  return (
    <div className="flex h-full flex-col transition-opacity duration-300 ease-in-out">
      <div className="flex items-center justify-between rounded-t-xl border-b border-b-dashed border-b-primary-100 bg-primary-25 p-6.5">
        <div>
          <span className="text-primary-300">{getBreadcrumb()}</span>
          <span>{formData.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-scroll hidebar p-6">
        {/* Common Fields */}
        <div className="space-y-[6px]">
          <Label htmlFor="connection-id" className="text-[13px] text-primary-400">
            Connection ID
          </Label>
          <div className="rounded-md bg-primary-50 px-3 py-2 font-mono text-primary-400 text-sm truncate" title={formData.id}>
            #{formData.id}
          </div>
        </div>

        <div className="space-y-[6px]">
          <Label htmlFor="connection-name" className="text-[13px] text-primary-400">
            Connection Name
          </Label>
          <Input
            id="connection-name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter connection name"
            className="w-full"
            disabled={isWalletConnection(selectedConnection)}
            title={isWalletConnection(selectedConnection) ? "Wallet names cannot be changed" : ""}
          />
          {isWalletConnection(selectedConnection) && (
            <p className="text-xs text-primary-400">
              Wallet names cannot be changed after creation
            </p>
          )}
        </div>

        {/* Type-specific Fields */}
        {isDatabaseConnection(selectedConnection) && (
          <DatabaseFields
            formData={formData as DatabaseFormData}
            onChange={handleInputChange}
            showSecrets={showSecrets}
            setShowSecrets={setShowSecrets}
            connectionId={selectedConnection.id}
            serviceClientId={selectedServiceClient?.clientId || ''}
            credentials={selectedConnection.credentials}
          />
        )}

        {isOAuthConnection(selectedConnection) && (
          <OAuthFields
            formData={formData as OAuthFormData}
            connection={selectedConnection}
            selectedScopes={selectedScopes}
            onScopesChange={handleScopeChange}
            onChange={handleInputChange}
          />
        )}

        {isWalletConnection(selectedConnection) && (
          <WalletFields
            formData={formData as WalletFormData}
            onChange={handleInputChange}
            connection={selectedConnection}
            showAddAddress={showAddAddress}
            setShowAddAddress={setShowAddAddress}
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            handleAddAddress={handleAddAddress}
            handleCancelAddAddress={handleCancelAddAddress}
            addWalletMutation={addWalletMutation}
          />
        )}
      </div>

      <div className="rounded-b-xl border-primary-100 border-t bg-primary-25 p-6">
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="outline" onClick={handleCancel} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} size="sm">
            {getSaveButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Database connection fields
function DatabaseFields({
  formData,
  onChange,
  showSecrets,
  setShowSecrets,
  connectionId,
  serviceClientId,
  credentials
}: {
  formData: DatabaseFormData;
  onChange: (field: string, value: any) => void;
  showSecrets: boolean;
  setShowSecrets: (show: boolean) => void;
  connectionId: string;
  serviceClientId: string;
  credentials: Record<string, any>;
}) {
  const [dbUrl, setDbUrl] = useState("*****");
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: unencryptedData, isLoading: isLoadingCredentials } = useQuery({
    ...hubQueries.userAuthConnectionUnencryptedOptions(connectionId),
    enabled: isRevealed,
  });

  useEffect(() => {
    if (unencryptedData?.credentials?.db_url && isRevealed) {
      setDbUrl(unencryptedData.credentials.db_url);
    }
  }, [unencryptedData, isRevealed]);

  const handleRevealToggle = () => {
    if (!isRevealed) {
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
      setDbUrl("*******************");
      setHasChanges(false);
    }
  };

  const handleDbUrlChange = (value: string) => {
    setDbUrl(value);
    setHasChanges(value !== unencryptedData?.credentials?.db_url);
  };

  const handleSaveChanges = () => {
    // Update the form data through the parent onChange function
    onChange("host", dbUrl);
    setHasChanges(false);
    toast.success("Database URL applied. Click 'Save Database' to persist changes.");
  };

  return (
    <>
      <div className="space-y-[6px]">
        <Label htmlFor="database-url" className="text-[13px] text-primary-400">
          Database URL
        </Label>
        <div className="relative">
          <Input
            id="database-url"
            type={isRevealed ? "url" : "password"}
            value={dbUrl}
            onChange={(e) => handleDbUrlChange(e.target.value)}
            placeholder="postgresql://user:pass@host:5432/db"
            className="w-full text-sm pr-20"
            disabled={!isRevealed}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoadingCredentials ? (
              <Loader2 className="size-3 animate-spin text-primary-400" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevealToggle}
                className="h-6 px-1"
              >
                {isRevealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </Button>
            )}
            {isRevealed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(dbUrl);
                  toast.success("Database URL copied to clipboard");
                }}
                className="h-6 px-1"
              >
                <Copy className="size-3" />
              </Button>
            )}
          </div>
        </div>
        {hasChanges && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-600">You have unsaved changes</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveChanges}
              className="h-6 px-2 text-xs"
            >
              Apply Changes
            </Button>
          </div>
        )}
        <p className="text-xs text-primary-400">
          Click the eye icon to reveal and edit your database connection string. Use "Save Database" to persist changes.
        </p>
      </div>

      <div className="space-y-[6px]">
        <Label htmlFor="database-status" className="text-[13px] text-primary-300">
          Status
        </Label>
        <Select
          value={formData.status}
          onValueChange={(value) => onChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Idle">Idle</SelectItem>
            <SelectItem value="Error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.lastActivity && (
        <div className="space-y-[6px]">
          <Label htmlFor="last-activity" className="text-[13px] text-primary-400">
            Last Activity
          </Label>
          <div className="rounded-md bg-primary-50 px-3 py-2 text-13px text-primary-400">
            {formData.lastActivity}
          </div>
        </div>
      )}
    </>
  );
}

// OAuth connection fields
function OAuthFields({
  formData,
  connection,
  selectedScopes,
  onScopesChange,
  onChange
}: {
  formData: OAuthFormData;
  connection: UserServiceConnection;
  selectedScopes: Permission[];
  onScopesChange: (scopes: Permission[]) => void;
  onChange: (field: string, value: any) => void;
}) {
  const { selectedServiceClient } = useAppStore();

  const scopeDefinitions = selectedServiceClient?.scopeDefinitions || []

  const availablePermissions = Object.entries(scopeDefinitions).map(([scope, label]) => ({
    id: scope,
    label: label as string
  }));

  return (
    <>
      <div className="space-y-[6px]">
        <Label htmlFor="oauth-scopes" className="text-[13px] text-primary-400">
          Scopes ({availablePermissions.length})
        </Label>
      </div>

      <PermissionSelector
        permissions={availablePermissions}
        initialSelected={selectedScopes}
        onSelectionChange={onScopesChange}
        placeholder="Search permissions..."
      />

      <div className="space-y-[6px]">
        <Label htmlFor="oauth-client" className="text-[13px] text-primary-400">
          Client ID
        </Label>
        <div className="rounded-md bg-primary-50 px-3 py-2 font-mono text-primary-400 text-sm truncate" title={formData.clientId}>
          {formData.clientId}
        </div>
      </div>

      {isOAuthConnection(connection) && connection.metadata.user && (
        <div className="space-y-[6px]">
          <Label htmlFor="oauth-user" className="text-[13px] text-primary-400">
            Connected Account
          </Label>
          <div className="rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-400">
            {connection.metadata.user.email || connection.metadata.user.name || connection.uniqueId}
          </div>
        </div>
      )}
    </>
  );
}

// Wallet connection fields
function WalletFields({
  formData,
  onChange,
  connection,
  showAddAddress,
  setShowAddAddress,
  newAddress,
  setNewAddress,
  handleAddAddress,
  handleCancelAddAddress,
  addWalletMutation
}: {
  formData: WalletFormData;
  onChange: (field: string, value: any) => void;
  connection: UserServiceConnection;
  showAddAddress: boolean;
  setShowAddAddress: (show: boolean) => void;
  newAddress: {
    chains: string[];
    pathFormat: string;
    path: string;
    curve: string;
    addressFormat: string;
  };
  setNewAddress: (value: any) => void;
  handleAddAddress: () => void;
  handleCancelAddAddress: () => void;
  addWalletMutation: any;
}) {
  const getChainDisplayName = (chainValue: string) => {
    for (const group of Object.values(BLOCKCHAIN_OPTIONS)) {
      for (const [name, value] of Object.entries(group.chains)) {
        if (value === chainValue) {
          return name;
        }
      }
    }
    return chainValue;
  };

  const handleAddChain = (chainValue: string) => {
    if (chainValue && !formData.chains.includes(chainValue)) {
      const newChains = [...formData.chains, chainValue];
      onChange("chains", newChains);
    }
  };

  const handleRemoveChain = (chainToRemove: string) => {
    const newChains = formData.chains.filter(chain => chain !== chainToRemove);
    onChange("chains", newChains);
  };

  return (
    <>
      {/* Wallet Addresses - Read Only */}
      <div className="space-y-[6px]">
        <Label className="text-[13px] text-primary-400">
          Wallet Addresses ({formData.addresses.length})
        </Label>
        <div className="space-y-3">
          {formData.addresses.map((address, index) => (
            <div key={index} className="border rounded-lg p-3 bg-primary-25">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {address.chains.map((chain, chainIndex) => (
                      <span
                        key={chainIndex}
                        className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                      >
                        {getChainDisplayName(chain)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="font-mono text-sm text-primary-800 bg-white px-2 py-1 rounded border flex items-center justify-between">
                  {address.address.slice(0, 10)}...{address.address.slice(-10)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(address.address);
                      toast.success("Address copied to clipboard");
                    }}
                    className="ml-2 h-5 px-1"
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>

                {address.derivationPath && (
                  <div className="text-xs text-primary-500">
                    Path: {address.derivationPath} | Curve: {address.curve.replace('CURVE_', '')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Address Button */}
        {!showAddAddress && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddAddress(true)}
            className="w-full mt-2"
          >
            Add New Address
          </Button>
        )}

        {/* Add Address Form */}
        {showAddAddress && (
          <div className="border rounded-lg p-4 bg-primary-25 mt-2">
            <h4 className="text-sm font-medium text-primary-800 mb-3">Add New Address</h4>

            {/* Blockchain Chains */}
            <div className="space-y-2 mb-4">
              <Label className="text-xs text-primary-400">
                Blockchain Chains <span className="text-red-500">*</span>
              </Label>

              {/* Display selected chains */}
              {newAddress.chains.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newAddress.chains.map((chainValue, chainIndex) => (
                    <div key={chainIndex} className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs">
                      <span>{getChainDisplayName(chainValue)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-primary-500 hover:text-primary-700"
                        onClick={() => setNewAddress((prev: any) => ({
                          ...prev,
                          chains: prev.chains.filter((_: any, i: number) => i !== chainIndex)
                        }))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chain selector */}
              <Select
                onValueChange={(value) => {
                  if (value && !newAddress.chains.includes(value)) {
                    setNewAddress((prev: any) => ({
                      ...prev,
                      chains: [...prev.chains, value]
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select blockchain chains" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLOCKCHAIN_OPTIONS).map(([groupKey, group]) => (
                    <SelectGroup key={groupKey}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {Object.entries(group.chains).map(([chainName, chainValue]) => (
                        <SelectItem
                          key={chainValue}
                          value={chainValue}
                          disabled={newAddress.chains.includes(chainValue)}
                        >
                          {chainName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <Label className="text-xs text-primary-400">Curve</Label>
                <Select
                  value={newAddress.curve || "none"}
                  onValueChange={(value) => setNewAddress((prev: any) => ({
                    ...prev,
                    curve: value === "none" ? "" : value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select curve" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="CURVE_SECP256K1">SECP256K1 (Ethereum/Bitcoin)</SelectItem>
                    <SelectItem value="CURVE_ED25519">ED25519 (Solana)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-primary-400">Address Format</Label>
                <Select
                  value={newAddress.addressFormat || "none"}
                  onValueChange={(value) => setNewAddress((prev: any) => ({
                    ...prev,
                    addressFormat: value === "none" ? "" : value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ADDRESS_FORMAT_ETHEREUM">Ethereum</SelectItem>
                    <SelectItem value="ADDRESS_FORMAT_SOLANA">Solana</SelectItem>
                    <SelectItem value="ADDRESS_FORMAT_BITCOIN">Bitcoin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="space-y-1">
                <Label className="text-xs text-primary-400">Derivation Path</Label>
                <Input
                  placeholder="e.g., m/44'/60'/0'/0/0"
                  value={newAddress.path}
                  onChange={(e) => setNewAddress((prev: any) => ({ ...prev, path: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-primary-400">Path Format</Label>
                <Select
                  value={newAddress.pathFormat || "none"}
                  onValueChange={(value) => setNewAddress((prev: any) => ({
                    ...prev,
                    pathFormat: value === "none" ? "" : value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select path format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="PATH_FORMAT_BIP32">BIP32</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelAddAddress}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddAddress}
                disabled={newAddress.chains.length === 0 || addWalletMutation.isPending}
                className="flex-1"
              >
                {addWalletMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Address'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Supported Chains - Editable */}
      <div className="space-y-[6px]">
        <Label className="text-[13px] text-primary-400">
          Supported Chains
        </Label>

        {/* Display selected chains */}
        {formData.chains.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 w-full">
            {formData.chains.map((chainValue, chainIndex) => (
              <div key={chainIndex} className="flex overflow-hidden items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs">
                <span className="whitespace-nowrap">{getChainDisplayName(chainValue)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full h-auto p-0 text-primary-500 hover:text-primary-700"
                  onClick={() => handleRemoveChain(chainValue)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Chain selector */}
        <Select onValueChange={handleAddChain}>
          <SelectTrigger className="w-full">
            <button></button>
            {/* <SelectValue placeholder="Add blockchain chain" /> */}
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BLOCKCHAIN_OPTIONS).map(([groupKey, group]) => (
              <SelectGroup key={groupKey}>
                <SelectLabel>{group.label}</SelectLabel>
                {Object.entries(group.chains).map(([chainName, chainValue]) => (
                  <SelectItem
                    key={chainValue}
                    value={chainValue}
                    disabled={formData.chains.includes(chainValue)}
                  >
                    {chainName}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.balance && (
        <div className="space-y-[6px]">
          <Label htmlFor="wallet-balance" className="text-[13px] text-primary-400">
            Balance
          </Label>
          <div className="rounded-md bg-primary-50 px-3 py-2 text-13px text-primary-400">
            {formData.balance}
          </div>
        </div>
      )}
    </>
  );
}
