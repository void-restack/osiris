import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DownloadIcon,
  PenLine,
  Unlink,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import { hubQueries } from "@/lib/queries";
import { useAppStore } from "@/lib/store";

interface AuthMethod {
  clientId: string;
  name: string;
  description: string;
  type: "oauth" | "secret_sharing" | "embedded_wallet";
  supportedScopes: string[];
  supportedServices: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

type Database = {
  id: number;
  name: string;
  host: string;
  lastActivity: string;
  status: "Active" | "Idle" | "Error";
};

const mockDatabases: Database[] = [
  {
    id: 1,
    name: "Marketing DB",
    host: "db.marketing.com",
    lastActivity: "2 hours ago",
    status: "Active",
  },
  {
    id: 2,
    name: "Backup DB",
    host: "backup.pgsql.net",
    lastActivity: "15 mins ago",
    status: "Idle",
  },
  {
    id: 4,
    name: "Testing DB",
    host: "staging.local",
    lastActivity: "15 mins ago",
    status: "Error",
  },
  {
    id: 5,
    name: "Analytics Snapshot",
    host: "analytics.pg.company",
    lastActivity: "2 hours ago",
    status: "Active",
  },
  {
    id: 6,
    name: "Sales DB",
    host: "sales.internal.net",
    lastActivity: "10 days ago",
    status: "Active",
  },
  {
    id: 7,
    name: "Archived Data DB",
    host: "archive.pgsql.io",
    lastActivity: "2 hours ago",
    status: "Active",
  },
  {
    id: 8,
    name: "HR Records DB",
    host: "hr.pg.dev",
    lastActivity: "2 hours ago",
    status: "Idle",
  },
];

const StatusBadge = ({ status }: { status: Database["status"] }) => {
  const configs = {
    Active: {
      icon: CheckCircle,
      className: "text-green-600 bg-green-50 border-green-200",
      text: "Active",
    },
    Idle: {
      icon: Clock,
      className: "text-gray-600 bg-gray-50 border-gray-200",
      text: "Idle",
    },
    Error: {
      icon: AlertTriangle,
      className: "text-red-600 bg-red-50 border-red-200",
      text: "Error",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-medium text-xs ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.text}
    </div>
  );
};

const createColumns = (
  openEditSidebar: (database: Database) => void,
): ColumnDef<Database>[] => [
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
      minSize: 10,
      maxSize: 10,
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="font-medium text-primary-800 text-sm">
          {row.original.name}
        </span>
      ),
      size: 600,
      minSize: 180,
      maxSize: 600,
    },
    {
      id: "host",
      header: "Host",
      accessorKey: "host",
      cell: ({ row }) => (
        <span className="rounded-[6px] bg-primary-50 px-2 py-0.5 font-mono text-primary-400 text-xs">
          {row.original.host}
        </span>
      ),
      enableHiding: true,
    },
    {
      id: "lastActivity",
      header: "Last Activity",
      accessorKey: "lastActivity",
      cell: ({ row }) => (
        <span className="text-primary-400 text-sm">
          {row.original.lastActivity}
        </span>
      ),
      enableHiding: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      enableHiding: true,
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
            onClick={() => openEditSidebar(row.original)}
          >
            <PenLine className="size-3 text-primary-300" />
          </Button>
        </div>
      ),
      size: 0,
      minSize: 0,
      maxSize: 0,
      enableSorting: false,
    },
  ];

export const Route = createFileRoute("/_hub/auth/$authId")({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(hubQueries.authMethodsOptions()),
});

function RouteComponent() {
  const { authId } = Route.useParams();
  const { data: authMethods } = useSuspenseQuery(
    hubQueries.authMethodsOptions(),
  );
  const { openEditSidebar } = useAppStore();

  const authMethod = authMethods.find(
    (method: AuthMethod) => method.clientId === authId,
  );

  if (!authMethod) {
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

  const columns = createColumns(openEditSidebar);

  const { table } = useDataTable({
    data: mockDatabases,
    columns: columns,
    pageCount: Math.ceil(mockDatabases.length / 10),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "oauth":
        return "bg-blue-400/30";
      case "secret_sharing":
        return "bg-purple-400/30";
      case "embedded_wallet":
        return "bg-green-400/30";
      default:
        return "bg-gray-400/30";
    }
  };

  const renderContent = () => {
    switch (authMethod.type) {
      case "secret_sharing":
        return (
          <>
            <div className="mb-8 flex flex-col gap-1">
              <h3 className="text-xl">Connected databases</h3>
              <span className="text-primary-300">
                List of all the connected databases
              </span>
            </div>
            <div>
              <DataTable table={table} />
            </div>
          </>
        );

      case "oauth":
        return (
          <div className="mb-8 flex flex-col gap-1">
            <h3 className="text-xl">OAuth Connections</h3>
            <span className="text-primary-300">
              Manage your OAuth connections and permissions
            </span>
            <div className="mt-8 rounded-lg border border-primary-200 border-dashed p-8 text-center">
              <p className="text-primary-400">
                OAuth connection management coming soon
              </p>
            </div>
          </div>
        );

      case "embedded_wallet":
        return (
          <div className="mb-8 flex flex-col gap-1">
            <h3 className="text-xl">Wallet Management</h3>
            <span className="text-primary-300">
              Manage your embedded wallet connections
            </span>
            <div className="mt-8 rounded-lg border border-primary-200 border-dashed p-8 text-center">
              <p className="text-primary-400">Wallet management coming soon</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="mb-8 flex flex-col gap-1">
            <h3 className="text-xl">Unknown Type</h3>
            <span className="text-primary-300">
              This authentication type is not yet supported
            </span>
          </div>
        );
    }
  };

  return (
    <div className="px-8 pt-10">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-6">
          <div
            className={`size-15 rounded-md ${getTypeColor(authMethod.type)}`}
          />
          <div className="flex flex-col">
            <h3 className="text-xl capitalize">{authMethod.name}</h3>
            <span className="text-primary-300">{authMethod.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button icon={DownloadIcon} iconPlacement="left" variant="secondary">
            {authMethod.supportedScopes.length} scopes
          </Button>
          <Button icon={Unlink} iconPlacement="left">
            Connect
          </Button>
        </div>
      </div>
      <div className="my-10 w-full border-t border-t-primary-100 border-dashed" />
      {renderContent()}
    </div>
  );
}
