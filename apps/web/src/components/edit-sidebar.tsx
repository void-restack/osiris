import { X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { PermissionSelector, type Permission } from "./ui/permission-selector";

export function EditConnectionSidebar() {
  const { selectedConnection, selectedServiceClient, closeEditSidebar } = useAppStore();
  const [formData, setFormData] = useState<ConnectionFormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);

  useEffect(() => {
    if (selectedConnection) {
      setFormData(connectionToFormData(selectedConnection));
      setHasChanges(false);

      // Initialize scopes for OAuth connections
      if (isOAuthConnection(selectedConnection) && selectedServiceClient?.scopeDefinitions) {
        const initialScopes = selectedConnection.scopes.map(scope => ({
          id: scope,
          label: selectedServiceClient.scopeDefinitions[scope] || scope
        }));
        setSelectedScopes(initialScopes);
      }
    }
  }, [selectedConnection, selectedServiceClient]);

  const handleInputChange = (field: string, value: any) => {
    if (formData) {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      if (selectedConnection) {
        const changed = JSON.stringify(newFormData) !== JSON.stringify(connectionToFormData(selectedConnection));
        setHasChanges(changed);
      }
    }
  };

  const handleSave = async () => {
    if (formData && hasChanges && selectedConnection) {
      try {
        if (isDatabaseConnection(selectedConnection)) {
          const dbFormData = formData as DatabaseFormData;
          await useCreateSecretSharingMutation().mutateAsync({
            serviceClientId: selectedConnection.clientId,
            secret: {
              ...selectedConnection.credentials,
              host: dbFormData.host,
            },
          });
        } else if (isOAuthConnection(selectedConnection)) {
          await useCreateServiceConnectionMutation().mutateAsync({
            serviceClientName: selectedServiceClient?.name || 'oauth',
            scopes: selectedConnection.scopes,
          });
        } else if (isWalletConnection(selectedConnection)) {
          await useUpdateWalletMutation().mutateAsync({
            id: selectedConnection.id,
            policy: selectedConnection.policy || { allow: [], deny: [] },
          });
        }

        setHasChanges(false);
      } catch (error: any) {
        console.error("Error saving connection:", error);
        alert(error.message || "Failed to save connection");
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

  if (!selectedConnection || !formData) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
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
          <div className="rounded-md bg-primary-50 px-3 py-2 font-mono text-primary-400 text-sm">
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
          />
        )}

        {isOAuthConnection(selectedConnection) && (
          <OAuthFields
            formData={formData as OAuthFormData}
            connection={selectedConnection}
            selectedScopes={selectedScopes}
            onScopesChange={setSelectedScopes}
            onChange={handleInputChange}
          />
        )}

        {isWalletConnection(selectedConnection) && (
          <WalletFields
            formData={formData as WalletFormData}
            onChange={handleInputChange}
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
  onChange
}: {
  formData: DatabaseFormData;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <>
      <div className="space-y-[6px]">
        <Label htmlFor="database-host" className="text-[13px] text-primary-400">
          Host
        </Label>
        <Input
          id="database-host"
          value={formData.host}
          onChange={(e) => onChange("host", e.target.value)}
          placeholder="Enter host URL"
          className="w-full text-sm"
        />
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


  const availablePermissions = selectedServiceClient?.scopeDefinitions ?
    Object.entries(selectedServiceClient.scopeDefinitions).map(([scope, label]) => ({
      id: scope,
      label: label as string
    })) : [];


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
  onChange
}: {
  formData: WalletFormData;
  onChange: (field: string, value: any) => void;
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
    </>
  );
}
