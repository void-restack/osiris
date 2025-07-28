import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { PenLine } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import { hubQueries } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import {
  type UserServiceConnection,
  type ServiceClient,
  getConnectionDisplayInfo,
} from "@/types/auth";
import { transformBackendServiceClient, transformBackendUserAuth } from "@/lib/transformer";

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

const createColumns = (
  openEditSidebar: (connection: UserServiceConnection, serviceClient: ServiceClient) => void,
  serviceClient: ServiceClient
): ColumnDef<UserServiceConnection>[] => [
    {
      id: "id",
      header: () => <div className="pl-[16px]">#</div>,
      accessorKey: "id",
      cell: ({ row }) => (
        <span className="pl-[16px] font-mono text-primary-400 text-sm">
          {row.original.id}
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
            <span className="font-medium text-primary-800 text-sm">
              {displayInfo.name}
            </span>
            <span className="text-primary-400 text-xs">
              {displayInfo.subtitle}
            </span>
          </div>
        );
      },
      size: 600,
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const displayInfo = getConnectionDisplayInfo(row.original);
        return displayInfo.details ? (
          <span className="rounded-[6px] bg-primary-50 px-2 py-0.5 font-mono text-primary-400 text-xs">
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
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end pr-[10px]">
          <Button
            variant="ghost"
            size="sm"
            className="size-6 border border-primary-100 p-0 text-primary-400 hover:text-primary-600"
            onClick={() => openEditSidebar(row.original, serviceClient)}
          >
            <PenLine className="size-3 text-primary-300" />
          </Button>
        </div>
      ),
      size: 0,
      enableSorting: false,
    },
  ];

export const Route = createFileRoute("/_hub/auth/$authId")({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) => {
    const [authMethods, userAuth] = await Promise.all([
      queryClient.ensureQueryData(hubQueries.authMethodsOptions()),
      queryClient.ensureQueryData(hubQueries.userAuthOptions())
    ]);
    return { authMethods, userAuth };
  },
});

function RouteComponent() {
  const { authId } = Route.useParams();
  const { data: authMethods } = useSuspenseQuery(hubQueries.authMethodsOptions());
  const { data: userAuth } = useSuspenseQuery(hubQueries.userAuthOptions());
  const { openEditSidebar } = useAppStore();

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

  const transformedServiceClient = transformBackendServiceClient(serviceClient);
  const allConnections = transformBackendUserAuth(userAuth);
  const connectionsForThisClient = allConnections.filter(conn => conn.clientId === authId);

  const columns = createColumns((connection, serviceClient) => {
    // Pass the original service client with scopeDefinitions
    openEditSidebar(connection, transformedServiceClient);
  }, transformedServiceClient);

  const { table } = useDataTable({
    data: connectionsForThisClient,
    columns: columns,
    pageCount: Math.ceil(connectionsForThisClient.length / 10),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "oauth": return "bg-blue-400/30";
      case "secret_sharing": return "bg-purple-400/30";
      case "embedded_wallet": return "bg-green-400/30";
      default: return "bg-gray-400/30";
    }
  };

  const getContentTitle = () => {
    switch (transformedServiceClient.type) {
      case "secret_sharing": return "Connected databases";
      case "oauth": return "OAuth Connections";
      case "embedded_wallet": return "Wallet Connections";
      default: return "Connections";
    }
  };

  const getContentDescription = () => {
    switch (transformedServiceClient.type) {
      case "secret_sharing": return "List of all the connected databases";
      case "oauth": return "Manage your OAuth connections and permissions";
      case "embedded_wallet": return "Manage your wallet connections";
      default: return "Manage your connections";
    }
  };

  return (
    <div className="px-8 pt-10">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`size-15 rounded-md ${getTypeColor(transformedServiceClient.type)}`} />
          <div className="flex flex-col">
            <h3 className="text-xl capitalize">{transformedServiceClient.name}</h3>
            <span className="text-primary-300">{transformedServiceClient.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary">
            {transformedServiceClient.type === 'oauth' ? `${transformedServiceClient.supportedScopes?.length || 0} scopes` :
              transformedServiceClient.type === 'secret_sharing' ? 'Database Config' :
                transformedServiceClient.type === 'embedded_wallet' ? 'Wallet Config' : 'Config'}
          </Button>
          <Button>
            {transformedServiceClient.type === 'oauth' ? 'Add Connection' :
              transformedServiceClient.type === 'secret_sharing' ? 'Add Database' :
                transformedServiceClient.type === 'embedded_wallet' ? 'Create Wallet' : 'Connect'}
          </Button>
        </div>
      </div>
      <div className="my-10 w-full border-t border-t-primary-100 border-dashed" />

      <div className="mb-8 flex flex-col gap-1">
        <h3 className="text-xl">{getContentTitle()}</h3>
        <span className="text-primary-300">{getContentDescription()}</span>
      </div>

      <div>
        <DataTable table={table} />
      </div>
    </div>
  );
}
