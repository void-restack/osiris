import { X, Eye, EyeOff, Copy, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import {
  useCreateServiceConnectionMutation,
  useUpdateSecretSharingMutation,
  useAddWalletMutation
} from "@/lib/mutations";
import { useQuery } from "@tanstack/react-query";
import { hubQueries } from "@/lib/queries";
import { PermissionSelector, type Permission } from "./ui/permission-selector";
import { getScopeDisplayName } from "@/lib/scope-definitions";

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

  const initialFormDataRef = useRef<ConnectionFormData | null>(null);

  const createServiceConnectionMutation = useCreateServiceConnectionMutation();
  const updateSecretSharingMutation = useUpdateSecretSharingMutation();
  const addWalletMutation = useAddWalletMutation();

  useEffect(() => {
    if (!selectedConnection || !isEditSidebarOpen) {
      setFormData(null);
      setHasChanges(false);
      setSelectedScopes([]);
      setInitialScopes([]);
      initialFormDataRef.current = null;
      return;
    }

    const newFormData = connectionToFormData(selectedConnection);
    setFormData(newFormData);
    initialFormDataRef.current = newFormData;
    setHasChanges(false);

    if (isOAuthConnection(selectedConnection) && selectedServiceClient?.scopeDefinitions) {
      const connectionScopes = selectedConnection.scopes.map(scope => ({
        id: scope,
        label: getScopeDisplayName(scope)
      }));
      setSelectedScopes(connectionScopes);
      setInitialScopes(connectionScopes);
    }
  }, [selectedConnection?.id, selectedServiceClient?.clientId, isEditSidebarOpen]);

  useEffect(() => {
    if (!formData || !initialFormDataRef.current) {
      setHasChanges(false);
      return;
    }

    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);

    const scopeChanged = selectedConnection && isOAuthConnection(selectedConnection)
      ? JSON.stringify(selectedScopes) !== JSON.stringify(initialScopes)
      : false;

    setHasChanges(formChanged || scopeChanged);
  }, [formData, selectedScopes, selectedConnection, initialScopes]);

  const handleScopeChange = useCallback((scopes: Permission[]) => {
    setSelectedScopes(scopes);
  }, []);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prevFormData => {
      if (!prevFormData) return prevFormData;
      return { ...prevFormData, [field]: value };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData || !hasChanges || !selectedConnection) return;

    try {
      if (isDatabaseConnection(selectedConnection)) {
        const dbFormData = formData as DatabaseFormData;
        await updateSecretSharingMutation.mutateAsync({
          id: selectedConnection.id,
          name: dbFormData.name || 'Database Connection',
          secret: {
            db_url: dbFormData.host,
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
        toast.success("Wallet settings updated!");
      }

      setHasChanges(false);
      toast.success("Connection saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save connection");
    }
  }, [
    formData,
    hasChanges,
    selectedConnection,
    selectedScopes,
    selectedServiceClient,
    updateSecretSharingMutation,
    createServiceConnectionMutation
  ]);

  const handleAddAddress = useCallback(async () => {
    if (!selectedConnection || !isWalletConnection(selectedConnection)) return;

    if (newAddress.chains.length === 0) {
      toast.error("Please select at least one blockchain chain");
      return;
    }

    try {
      const walletMetadata = selectedConnection.metadata;

      await addWalletMutation.mutateAsync({
        id: selectedConnection.id,
        walletId: walletMetadata?.id || '',
        accountId: walletMetadata?.accounts?.id || '',
        addresses: [newAddress]
      });

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
      toast.error(error.message || "Failed to add address");
    }
  }, [selectedConnection, newAddress, addWalletMutation]);

  const handleCancelAddAddress = useCallback(() => {
    setNewAddress({
      chains: [],
      pathFormat: '',
      path: '',
      curve: '',
      addressFormat: ''
    });
    setShowAddAddress(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      const confirmDiscard = window.confirm("Discard unsaved changes?");
      if (!confirmDiscard) return;
    }
    closeEditSidebar();
  }, [hasChanges, closeEditSidebar]);

  const breadcrumb = useMemo(() => {
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
  }, [selectedServiceClient]);

  const saveButtonText = useMemo(() => {
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
  }, [selectedServiceClient]);

  if (!selectedConnection || !formData || !isEditSidebarOpen) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-primary-100">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-primary-800">{`${breadcrumb}${formData.name}`}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeEditSidebar}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
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
      </div>

      <div className="p-6 border-t border-primary-100 space-y-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={!hasChanges}
          >
            {saveButtonText}
          </Button>
        </div>
        {hasChanges && (
          <p className="text-xs text-primary-500 text-center">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
}

const DatabaseFields = ({
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
}) => {
  const [dbUrl, setDbUrl] = useState("*****");
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: unencryptedData, isLoading: isLoadingCredentials } = useQuery({
    ...hubQueries.userAuthConnectionUnencryptedOptions(connectionId),
    enabled: isRevealed,
  });

  useEffect(() => {
    if (unencryptedData?.credentials?.db_url && isRevealed) {
      setDbUrl(unencryptedData.credentials.db_url);
    }
  }, [unencryptedData, isRevealed]);

  const handleRevealToggle = useCallback(() => {
    if (!isRevealed) {
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
      setDbUrl("*******************");
      setHasLocalChanges(false);
    }
  }, [isRevealed]);

  const handleDbUrlChange = useCallback((value: string) => {
    setDbUrl(value);
    setHasLocalChanges(value !== unencryptedData?.credentials?.db_url);
  }, [unencryptedData]);

  const handleSaveChanges = useCallback(() => {
    onChange("host", dbUrl);
    setHasLocalChanges(false);
    toast.success("Database URL applied. Click 'Save Database' to persist changes.");
  }, [onChange, dbUrl]);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(dbUrl);
    toast.success("Database URL copied to clipboard");
  }, [dbUrl]);

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
                onClick={handleCopyToClipboard}
                className="h-6 px-1"
              >
                <Copy className="size-3" />
              </Button>
            )}
          </div>
        </div>
        {hasLocalChanges && (
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
};

const OAuthFields = ({
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
}) => {
  const { selectedServiceClient } = useAppStore();

  const scopeDefinitions = selectedServiceClient?.scopeDefinitions || {};

  const availablePermissions = useMemo(() =>
    Object.entries(scopeDefinitions).map(([scope, label]) => ({
      id: scope,
      label: getScopeDisplayName(scope) || (label as string) || scope
    })),
    [scopeDefinitions]
  );

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
};

const WalletFields = ({
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
}) => {
  const getChainDisplayName = useCallback((chainValue: string) => {
    for (const group of Object.values(BLOCKCHAIN_OPTIONS)) {
      for (const [name, value] of Object.entries(group.chains)) {
        if (value === chainValue) {
          return name;
        }
      }
    }
    return chainValue;
  }, []);

  const handleCopyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  }, []);

  return (
    <>
      <div className="space-y-[6px]">
        <Label className="text-[13px] text-primary-400">
          Wallet Addresses ({formData.addresses.length})
        </Label>
        <div className="space-y-3">
          {formData.addresses.map((address, index) => (
            <div key={`address-${index}-${address.address}`} className="border rounded-lg p-3 bg-primary-25">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {address.chains.map((chain) => (
                      <span
                        key={`${index}-${chain}`}
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
                    onClick={() => handleCopyAddress(address.address)}
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

        {showAddAddress && (
          <AddAddressForm
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            handleAddAddress={handleAddAddress}
            handleCancelAddAddress={handleCancelAddAddress}
            addWalletMutation={addWalletMutation}
            getChainDisplayName={getChainDisplayName}
            formData={formData}
          />
        )}
      </div>
    </>
  );
};

const AddAddressForm = ({
  newAddress,
  setNewAddress,
  handleAddAddress,
  handleCancelAddAddress,
  addWalletMutation,
  getChainDisplayName,
  formData
}: {
  newAddress: any;
  setNewAddress: (value: any) => void;
  handleAddAddress: () => void;
  handleCancelAddAddress: () => void;
  addWalletMutation: any;
  getChainDisplayName: (chainValue: string) => string;
  formData: WalletFormData;
}) => {
  const getChainType = (chainValue: string): 'EVM' | 'SVM' | null => {
    if (Object.values(BLOCKCHAIN_OPTIONS.EVM.chains).includes(chainValue)) {
      return 'EVM';
    }
    if (Object.values(BLOCKCHAIN_OPTIONS.SVM.chains).includes(chainValue)) {
      return 'SVM';
    }
    return null;
  };

  const currentChainType = newAddress.chains.length > 0 ? getChainType(newAddress.chains[0]) : null;

  const calculateNextDerivationPath = useCallback((chainType: 'EVM' | 'SVM'): string => {
    const existingAddresses = formData.addresses || [];

    if (chainType === 'EVM') {
      const evmAddresses = existingAddresses.filter(addr =>
        addr.chains.some(chain => getChainType(chain) === 'EVM')
      );

      let maxIndex = -1;
      evmAddresses.forEach(addr => {
        if (addr.derivationPath) {
          const match = addr.derivationPath.match(/m\/44'\/60'\/0'\/0\/(\d+)/);
          if (match) {
            maxIndex = Math.max(maxIndex, parseInt(match[1]));
          }
        }
      });

      return `m/44'/60'/0'/0/${maxIndex + 1}`;
    } else {
      // For SVM (Solana), use similar pattern but with Solana's coin type
      const svmAddresses = existingAddresses.filter(addr =>
        addr.chains.some(chain => getChainType(chain) === 'SVM')
      );

      let maxIndex = -1;
      svmAddresses.forEach(addr => {
        if (addr.derivationPath) {
          const match = addr.derivationPath.match(/m\/44'\/501'\/0'\/0\/(\d+)/);
          if (match) {
            maxIndex = Math.max(maxIndex, parseInt(match[1]));
          }
        }
      });

      return `m/44'/501'/0'/0/${maxIndex + 1}`;
    }
  }, [formData.addresses]);

  // Auto-fill fields based on chain type
  const autoFillFields = useCallback((chainType: 'EVM' | 'SVM') => {
    const updates: any = {
      pathFormat: 'PATH_FORMAT_BIP32',
      path: calculateNextDerivationPath(chainType)
    };

    if (chainType === 'EVM') {
      updates.curve = 'CURVE_SECP256K1';
      updates.addressFormat = 'ADDRESS_FORMAT_ETHEREUM';
    } else if (chainType === 'SVM') {
      updates.curve = 'CURVE_ED25519';
      updates.addressFormat = 'ADDRESS_FORMAT_SOLANA';
    }

    setNewAddress((prev: any) => ({
      ...prev,
      ...updates
    }));
  }, [calculateNextDerivationPath, setNewAddress]);

  const handleChainChange = useCallback((value: string) => {
    if (!value || newAddress.chains.includes(value)) return;

    const selectedChainType = getChainType(value);
    if (!selectedChainType) return;

    // If this is the first chain selection, auto-fill fields
    if (newAddress.chains.length === 0) {
      setNewAddress((prev: any) => ({
        ...prev,
        chains: [value]
      }));
      autoFillFields(selectedChainType);
    } else {
      // Check if the new chain is compatible with existing selections
      if (currentChainType === selectedChainType) {
        setNewAddress((prev: any) => ({
          ...prev,
          chains: [...prev.chains, value]
        }));
      } else {
        toast.error(`Cannot mix ${currentChainType} and ${selectedChainType} chains in the same address`);
      }
    }
  }, [newAddress.chains, currentChainType, setNewAddress, autoFillFields]);

  const handleRemoveChain = useCallback((chainIndex: number) => {
    setNewAddress((prev: any) => {
      const newChains = prev.chains.filter((_: any, i: number) => i !== chainIndex);

      // If all chains are removed, reset the auto-filled fields
      if (newChains.length === 0) {
        return {
          ...prev,
          chains: newChains,
          curve: '',
          addressFormat: '',
          path: '',
          pathFormat: ''
        };
      }

      return {
        ...prev,
        chains: newChains
      };
    });
  }, [setNewAddress]);

  // Filter available chains based on current selection
  const getAvailableChains = useMemo(() => {
    const available: { [key: string]: { [key: string]: string } } = {};

    Object.entries(BLOCKCHAIN_OPTIONS).forEach(([groupKey, group]) => {
      if (currentChainType === null || groupKey === currentChainType) {
        available[groupKey] = { ...group.chains };
      }
    });

    return available;
  }, [currentChainType]);

  return (
    <div className="border rounded-lg p-4 bg-primary-25 mt-2">
      <h4 className="text-sm font-medium text-primary-800 mb-3">Add New Address</h4>

      <div className="space-y-2 mb-4">
        <Label className="text-xs text-primary-400">
          Blockchain Chains <span className="text-red-500">*</span>
        </Label>

        {currentChainType && (
          <div className="text-xs text-primary-500 mb-2">
            Selected type: {currentChainType} (only {currentChainType} chains can be added to this address)
          </div>
        )}

        {newAddress.chains.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {newAddress.chains.map((chainValue: string, chainIndex: number) => (
              <div key={`new-chain-${chainIndex}-${chainValue}`} className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs">
                <span>{getChainDisplayName(chainValue)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-primary-500 hover:text-primary-700"
                  onClick={() => handleRemoveChain(chainIndex)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <Select onValueChange={handleChainChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select blockchain chains" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(getAvailableChains).map(([groupKey, chains]) => (
              <SelectGroup key={groupKey}>
                <SelectLabel>{BLOCKCHAIN_OPTIONS[groupKey as keyof typeof BLOCKCHAIN_OPTIONS].label}</SelectLabel>
                {Object.entries(chains).map(([chainName, chainValue]) => (
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

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <Label className="text-xs text-primary-400">Curve</Label>
          <Input
            value={newAddress.curve || ''}
            disabled
            placeholder="Auto-filled based on chain"
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-primary-400">Address Format</Label>
          <Input
            value={newAddress.addressFormat || ''}
            disabled
            placeholder="Auto-filled based on chain"
            className="bg-gray-50"
          />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="space-y-1">
          <Label className="text-xs text-primary-400">Derivation Path</Label>
          <Input
            value={newAddress.path || ''}
            disabled
            placeholder="Auto-generated based on existing addresses"
            className="bg-gray-50"
          />
          <p className="text-xs text-primary-400">
            Automatically calculated as the next available path
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-primary-400">Path Format</Label>
          <Input
            value={newAddress.pathFormat || ''}
            disabled
            placeholder="Always BIP32"
            className="bg-gray-50"
          />
        </div>
      </div>

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
  );
};