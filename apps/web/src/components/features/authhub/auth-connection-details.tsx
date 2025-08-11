import { Database, Wallet, Key, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  type UserServiceConnection,
  isOAuthConnection,
  isDatabaseConnection,
  isWalletConnection,
} from "@/types/auth";
import { formatScopeForDisplay } from "@/lib/scope-utils";

interface AuthConnectionDetailsProps {
  connection: UserServiceConnection;
  serviceClient: any;
}

export function AuthConnectionDetails({ connection, serviceClient }: AuthConnectionDetailsProps) {
  const [showSecrets, setShowSecrets] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getConnectionIcon = () => {
    switch (serviceClient.type) {
      case 'secret_sharing':
        return <Database className="size-5" />;
      case 'embedded_wallet':
        return <Wallet className="size-5" />;
      case 'oauth':
        return <Key className="size-5" />;
      default:
        return null;
    }
  };

  const getConnectionTypeLabel = () => {
    switch (serviceClient.type) {
      case 'secret_sharing':
        return 'Secret Sharing';
      case 'embedded_wallet':
        return 'Embedded Wallet';
      case 'oauth':
        return 'OAuth';
      default:
        return serviceClient.type;
    }
  };

  const renderOAuthDetails = () => {
    if (!isOAuthConnection(connection)) return null;

    return (
      <div className="space-y-4">
        {connection.metadata?.user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connected User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-800">
                    {connection.metadata.user.name?.charAt(0) || connection.metadata.user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-primary-800">
                    {connection.metadata.user.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-primary-400">
                    {connection.metadata.user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {connection.scopes && connection.scopes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Granted Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {connection.scopes.map((scope) => (
                  <Badge key={scope} variant="secondary" className="text-xs">
                    {formatScopeForDisplay(scope)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderDatabaseDetails = () => {
    if (!isDatabaseConnection(connection)) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Encrypted Credentials</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
                className="h-6 px-2"
              >
                {showSecrets ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {showSecrets ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showSecrets ? (
              <div className="space-y-2">
                {Object.entries(connection.credentials).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-primary-50 rounded">
                    <span className="text-xs font-medium text-primary-600">{key}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary-400 truncate max-w-32" title={String(value)}>
                        {String(value).substring(0, 20)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(String(value), key)}
                        className="h-4 w-4 p-0"
                      >
                        {copied === key ? <CheckCircle className="size-3" /> : <Copy className="size-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-primary-400 mt-2">
                  Note: Credentials are encrypted and cannot be edited directly.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-primary-600">
                  Credentials are encrypted for security
                </p>
                <p className="text-xs text-primary-400 mt-1">
                  Click "Show" to view encrypted data
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {connection.metadata?.status && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={connection.metadata.status === 'Active' ? 'default' : 'secondary'}
                className="gap-1"
              >
                {connection.metadata.status}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderWalletDetails = () => {
    if (!isWalletConnection(connection)) return null;

    return (
      <div className="space-y-4">
        {connection.metadata?.walletAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Wallet Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-primary-600 truncate flex-1" title={connection.metadata.walletAddress}>
                  {connection.metadata.walletAddress}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(connection.metadata.walletAddress, 'Address')}
                  className="h-6 w-6 p-0"
                >
                  {copied === 'Address' ? <CheckCircle className="size-3" /> : <Copy className="size-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {connection.metadata?.chain && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Blockchain Network</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="gap-1">
                {connection.metadata.chain}
              </Badge>
            </CardContent>
          </Card>
        )}

        {connection.metadata?.accounts && connection.metadata.accounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Wallet Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connection.metadata.accounts.map((account: any, index: number) => (
                  <div key={index} className="border border-primary-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-primary-600">
                        Account {index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {account.chains.join(', ')}
                      </Badge>
                    </div>
                    {account.addresses.map((address: any, addrIndex: number) => (
                      <div key={addrIndex} className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-primary-400 truncate flex-1" title={address.address}>
                          {address.address}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(address.address, `Address ${addrIndex + 1}`)}
                          className="h-4 w-4 p-0"
                        >
                          {copied === `Address ${addrIndex + 1}` ? <CheckCircle className="size-3" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {connection.policy && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Wallet Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-primary-600">Allow:</span>
                  <div className="text-sm text-primary-400 mt-1">
                    {connection.policy.allow?.length > 0 ? connection.policy.allow.join(', ') : 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-600">Deny:</span>
                  <div className="text-sm text-primary-400 mt-1">
                    {connection.policy.deny?.length > 0 ? connection.policy.deny.join(', ') : 'None'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Header */}
      <div className="flex items-center gap-3">
        {getConnectionIcon()}
        <div>
          <h3 className="font-medium text-primary-800">{connection.name}</h3>
          <p className="text-sm text-primary-400">{getConnectionTypeLabel()} Connection</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {connection.id.split('-')[0]}...
        </Badge>
      </div>

      {/* Connection Details */}
      {isOAuthConnection(connection) && renderOAuthDetails()}
      {isDatabaseConnection(connection) && renderDatabaseDetails()}
      {isWalletConnection(connection) && renderWalletDetails()}
    </div>
  );
} 