import { X, Eye, EyeOff, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useCreateSecretSharingMutation, useCreateServiceConnectionMutation, useUpdateWalletMutation } from "@/lib/mutations";
import { useQuery } from "@tanstack/react-query";
import { hubQueries } from "@/lib/queries";
import { PermissionSelector, type Permission } from "./ui/permission-selector";
import PolicyBuilder from "./rule-builder";

export function EditConnectionSidebar() {
  const { selectedConnection, selectedServiceClient, closeEditSidebar, isEditSidebarOpen } = useAppStore();
  const [formData, setFormData] = useState<ConnectionFormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
  const [initialScopes, setInitialScopes] = useState<Permission[]>([]);
  const [showSecrets, setShowSecrets] = useState(false);

  const createSecretSharingMutation = useCreateSecretSharingMutation();
  const createServiceConnectionMutation = useCreateServiceConnectionMutation();
  const updateWalletMutation = useUpdateWalletMutation();

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
          await createSecretSharingMutation.mutateAsync({
            serviceClientId: selectedServiceClient?.clientId || '',
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
          await updateWalletMutation.mutateAsync({
            id: selectedConnection.id,
            policy: selectedConnection.policy || { allow: [], deny: [] },
          });
        }

        setHasChanges(false);
        toast.success("Connection saved successfully!");
      } catch (error: any) {
        console.error("Error saving connection:", error);
        toast.error(error.message || "Failed to save connection");
      }
    }
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
          />
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

  // Query for unencrypted credentials when revealed
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

// Default scope definitions fallback
const DEFAULT_SCOPE_DEFINITIONS: Record<string, string> = {
  "read": "Read",
  "write": "Write",
  "admin": "Admin",
  "user": "User",
  "profile": "Profile",
  "email": "Email",
  "openid": "OpenID",
  "offline_access": "Offline Access",
  "full_access": "Full Access",
  "limited_access": "Limited Access"
};

// Create scope definitions from supported scopes if none exist
function createScopeDefinitions(supportedScopes: string[] = []): Record<string, string> {
  const definitions: Record<string, string> = {};

  for (const scope of supportedScopes) {
    // Use default mapping if available, otherwise format the scope name
    if (DEFAULT_SCOPE_DEFINITIONS[scope]) {
      definitions[scope] = DEFAULT_SCOPE_DEFINITIONS[scope];
    } else {
      // Convert snake_case or kebab-case to Title Case
      definitions[scope] = scope
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }

  return definitions;
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

  // Use existing scopeDefinitions or create them from supportedScopes
  const scopeDefinitions = selectedServiceClient?.scopeDefinitions ||
    createScopeDefinitions(selectedServiceClient?.supportedScopes || []);

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
  connection
}: {
  formData: WalletFormData;
  onChange: (field: string, value: any) => void;
  connection: UserServiceConnection;
}) {
  return (
    <>
      <div className="space-y-[6px]">
        <Label htmlFor="wallet-address" className="text-[13px] text-primary-400">
          Wallet Address
        </Label>
        <Input
          id="wallet-address"
          value={formData.walletAddress}
          onChange={(e) => onChange("walletAddress", e.target.value)}
          placeholder="Enter wallet address"
          className="w-full font-mono text-sm"
          title={formData.walletAddress}
        />
      </div>

      <div className="space-y-[6px]">
        <Label htmlFor="wallet-chain" className="text-[13px] text-primary-400">
          Chain
        </Label>
        <Input
          id="wallet-chain"
          value={formData.chain}
          onChange={(e) => onChange("chain", e.target.value)}
          placeholder="Enter chain"
          className="w-full text-sm"
        />
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

      {isWalletConnection(connection) && connection.policy && (
        <div className="space-y-[6px]">
          <Label className="text-[13px] text-primary-400">
            Wallet Policy Rules
          </Label>
          <div className="border rounded-lg p-4">
            <PolicyBuilder
              value={JSON.stringify(connection.policy, null, 2)}
              onChange={(newPolicyJson: string) => {
                try {
                  const newPolicy = JSON.parse(newPolicyJson);
                  onChange("policy", newPolicy);
                } catch (error) {
                  console.error("Invalid policy JSON:", error);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
