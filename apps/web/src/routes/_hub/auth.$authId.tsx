import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PenLine, Trash2, Database, Wallet, Key, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDataTable } from "@/hooks/use-data-table";
import { hubQueries } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { useDisconnectServiceMutation } from "@/lib/mutations";
import { toast } from "sonner";
import { AuthMethodDialog } from "@/components/features/authhub/auth-method-dialog";
import {
  type UserServiceConnection,
  type ServiceClient,
  getConnectionDisplayInfo,
} from "@/types/auth";
import { transformBackendServiceClient, transformBackendUserAuth } from "@/lib/transformer";
import { getScopeDisplayName } from "@/lib/scope-definitions";

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, any> = {
    Active: { className: "text-green-600 bg-green-50 border-green-200", text: "Active" },
    Idle: { className: "text-gray-600 bg-gray-50 border-gray-200", text: "Idle" },
    Error: { className: "text-red-600 bg-red-50 border-red-200", text: "Error" },
    Expired: { className: "text-orange-600 bg-orange-50 border-orange-200", text: "Expired" },
  };

  const config = configs[status] || configs.Idle;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-medium text-xs ${config.className}`}>
      {config.text}
    </div>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const configs: Record<string, { className: string; text: string; icon: any }> = {
    oauth: {
      className: "text-blue-600 bg-blue-50 border-blue-200",
      text: "OAuth",
      icon: Key
    },
    secret_sharing: {
      className: "text-purple-600 bg-purple-50 border-purple-200",
      text: "Secret Sharing",
      icon: Database
    },
    embedded_wallet: {
      className: "text-orange-600 bg-orange-50 border-orange-200",
      text: "Embedded Wallet",
      icon: Wallet
    },
  };

  const config = configs[type] || { className: "text-gray-600 bg-gray-50 border-gray-200", text: type, icon: Key };
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-medium text-xs ${config.className}`}>
      <Icon className="size-3" />
      {config.text}
    </div>
  );
};

const createColumns = (
  openEditSidebar: (connection: UserServiceConnection, serviceClient: ServiceClient) => void,
  disconnectConnection: (connectionId: string) => void,
  serviceClient: ServiceClient
): ColumnDef<UserServiceConnection>[] => [
    {
      id: "id",
      header: () => <div className="pl-[16px]">#</div>,
      accessorKey: "id",
      cell: ({ row }) => (
        <span className="pl-[16px] font-mono text-primary-400 text-sm truncate max-w-24" title={row.original.id}>
          {row.original.id.slice(0, 4)}...{row.original.id.slice(-5)}
        </span>
      ),
      size: 10,
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => {
        const displayInfo = getConnectionDisplayInfo(row.original);
        return (
          <div className="flex flex-col">
            <p className="font-medium text-primary-800 text-sm max-w-xs truncate">
              {displayInfo.name}
            </p>
            {/* <span className="text-primary-400 text-xs">
              {displayInfo.subtitle}
            </span> */}
          </div>
        );
      },
      size: 600,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => <TypeBadge type={serviceClient.type} />,
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const displayInfo = getConnectionDisplayInfo(row.original);
        return displayInfo.details ? (
          <span className="rounded-[6px] bg-primary-50 px-2 py-0.5 font-mono text-primary-400 text-xs truncate max-w-32" title={displayInfo.details}>
            {displayInfo.details}
          </span>
        ) : null;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const displayInfo = getConnectionDisplayInfo(row.original);
        return <StatusBadge status={displayInfo.status} />;
      },
    },
    {
      id: "scopes",
      header: "Scopes",
      cell: ({ row }) => {
        if (row.original.scopes && row.original.scopes.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.original.scopes.slice(0, 2).map((scope: string) => {
                const scopeLabel = getScopeDisplayName(scope);
                return (
                  <Badge key={scope} variant="secondary" className="text-xs">
                    {scopeLabel}
                  </Badge>
                );
              })}
              {row.original.scopes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{row.original.scopes.length - 2} more
                </Badge>
              )}
            </div>
          );
        }
        return null;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end pr-[10px] gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="size-6 border border-primary-100 p-0 text-primary-400 hover:text-primary-600"
            onClick={() => openEditSidebar(row.original, serviceClient)}
          >
            <PenLine className="size-3 text-primary-300" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-6 border border-red-100 p-0 text-red-400 hover:text-red-600"
            onClick={() => disconnectConnection(row.original.id)}
          >
            <Trash2 className="size-3 text-red-300" />
          </Button>
        </div>
      ),
    },
  ];

export const Route = createFileRoute("/_hub/auth/$authId")({
  component: RouteComponent,
  beforeLoad: () => {
    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    const [authMethods] = await Promise.all([
      queryClient.ensureQueryData(hubQueries.authMethodsOptions(undefined)),
    ]);
    return { authMethods };
  },
});

function RouteComponent() {
  const { authId } = Route.useParams();
  const { isAuthenticated } = useAuth();
  const { data: authMethods } = useSuspenseQuery(hubQueries.authMethodsOptions(undefined));
  const { data: userAuth } = useQuery({
    ...hubQueries.userAuthOptions(isAuthenticated),
    enabled: isAuthenticated,
  });
  const { openEditSidebar, closeEditSidebar } = useAppStore();
  const { mutate: disconnectService } = useDisconnectServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    return () => {
      closeEditSidebar();
    };
  }, [closeEditSidebar]);

  const serviceClient = authMethods.find((method: any) => method.clientId === authId);

  if (!serviceClient) {
    return (
      <div className="px-8 pt-10">
        <div className="text-center">
          <h3 className="text-xl">Auth method not found</h3>
          <p className="text-primary-300">
            The requested authentication method could not be found.
          </p>
        </div>
      </div>
    );
  }

  console.log("serviceClient", serviceClient)

  const transformedServiceClient = transformBackendServiceClient(serviceClient);

  // Only process user connections if authenticated and data is available
  const allConnections = isAuthenticated && userAuth ? transformBackendUserAuth(userAuth) : [];
  const connectionsForThisClient = allConnections.filter(conn => conn.clientId === authId);

  const columns = createColumns((connection, serviceClient) => {
    openEditSidebar(connection, transformedServiceClient);
  }, (connectionId) => {
    disconnectService(connectionId);
    toast.success("Connection disconnected");
  }, transformedServiceClient);

  const { table } = useDataTable({
    data: connectionsForThisClient,
    columns: columns,
    pageCount: Math.ceil(connectionsForThisClient.length / 10),
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      oauth: "bg-blue-400",
      secret_sharing: "bg-purple-400",
      embedded_wallet: "bg-orange-400",
    };
    return colors[type] || "bg-gray-400";
  };

  const getContentTitle = () => {
    return `${transformedServiceClient.name.charAt(0).toUpperCase()}${transformedServiceClient.name.slice(1)} Connections`;
  };

  const getContentDescription = () => {
    return `Manage your ${transformedServiceClient.name.toLowerCase()} connections`;
  };

  return (
    <div className="px-8 pt-10">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-6">
          {transformedServiceClient.iconUrl ? (
            <Avatar className="size-15 rounded-md shrink-0">
              <AvatarImage src={transformedServiceClient.iconUrl} alt={transformedServiceClient.name} />
              <AvatarFallback className="text-lg font-bold capitalize">
                {transformedServiceClient.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`size-15 rounded-md shrink-0 ${getTypeColor(transformedServiceClient.type)}`} />
          )}
          <div className="flex flex-col">
            <h3 className="text-xl capitalize">{transformedServiceClient.name}</h3>
            <span className="text-primary-300">{transformedServiceClient.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* <Button variant="secondary">
            {transformedServiceClient.type === 'oauth' ? `${transformedServiceClient.supportedScopes?.length || 0} scopes` :
              transformedServiceClient.type === 'secret_sharing' ? 'Database Config' :
                transformedServiceClient.type === 'embedded_wallet' ? 'Wallet Config' : 'Config'}
          </Button> */}

          {isAuthenticated && (
            <AuthMethodDialog
              method={transformedServiceClient}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              trigger={
                <Button onClick={() => setDialogOpen(true)}>
                  {transformedServiceClient.type === 'oauth' ? 'Add Connection' :
                    transformedServiceClient.type === 'secret_sharing' ? 'Add Database' :
                      transformedServiceClient.type === 'embedded_wallet' ? 'Create Wallet' : 'Connect'}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="my-10 w-full border-t border-t-primary-100 border-dashed" />

      <div className="mb-8 flex flex-col gap-1">
        <h3 className="text-xl">{getContentTitle()}</h3>
        <span className="text-primary-300 text-pretty">{getContentDescription()}</span>
      </div>

      {isAuthenticated ? (
        <div>
          <DataTable table={table} />
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h4 className="text-lg font-medium text-primary-700 mb-3">Sign in to manage connections</h4>
            <p className="text-primary-500 mb-6">
              View and manage your {transformedServiceClient.name.toLowerCase()} connections by signing in to your account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}