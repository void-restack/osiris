import { ICONS } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ServiceConnection = {
	connectionId: string;
	serviceClientName: string;
	serviceClientType: "oauth" | "secret_sharing" | "embedded_wallet";
	supportedServices: string[];
	scopes: string[];
};

export type McpServer = {
	deploymentId: string;
	userMcpId: string;
	url: string;
	scopes: string[];
	status: "active" | "inactive" | "pending";
	createdAt: string;
	updatedAt: string;
	connections: ServiceConnection[];
};

export function Server(props: McpServer) {
	return (
		<div className="rounded-2xl border p-4">
			<div className="flex items-center gap-2">
				<h1 className="text-primary-800">Deployment {props.deploymentId.slice(0, 8)}...</h1>
				<span className="text-primary-300">/</span>
				<p className="text-primary-300 text-sm">{props.createdAt}</p>
				<Badge
					variant={props.status === 'active' ? 'default' : 'secondary'}
					className="ml-2"
				>
					{props.status}
				</Badge>
			</div>
			<div className="rounded-md bg-primary-25">
				{props.connections.map((connection) => (
					<ServerConnection key={connection.connectionId} {...connection} />
				))}
			</div>
		</div>
	);
}

export function ServerList({ data }: { data: McpServer[] }) {
	return (
		<div className="flex w-full flex-col gap-y-3">
			{data.map((server) => (
				<Server key={server.deploymentId} {...server} />
			))}
		</div>
	);
}

function ServerConnection(props: ServiceConnection) {
	return (
		<div className="flex h-[72px] w-full items-center justify-between border-b border-b-primary-100 p-4">
			<div className="flex items-center gap-3">
				<img width={36} height={36} src={`/test/${props.serviceClientName.toLowerCase()}.svg`} alt={props.serviceClientName} />
				<div className="flex flex-col text-sm">
					<p className="font-medium text-primary-800">{props.serviceClientName}</p>
					<p className="text-primary-300 text-xs">
						{props.scopes.length} scopes allowed
					</p>
				</div>
			</div>

			{props.scopes.length > 0 ? (
				<Button
					className="cursor-pointer bg-primary-100 text-primary-400 hover:bg-primary-100"
					size={"sm"}
					variant={"secondary"}
				>
					<ICONS.dubbleCheck />
					Authenticated
				</Button>
			) : (
				<Button
					className="cursor-pointer bg-success-50 text-success-500 hover:bg-success-[#2DCA041A]"
					size={"sm"}
					variant={"secondary"}
				>
					<ICONS.codeCheck />
					Authenticate
				</Button>
			)}
		</div>
	);
}
