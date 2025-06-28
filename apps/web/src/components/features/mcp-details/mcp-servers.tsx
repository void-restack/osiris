import { Edit } from "lucide-react";
import { ICONS } from "@/components/icons";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type App = {
	icon: string;
	name: string;
	scopes: number;
	isAuthenticated: boolean;
};

export type McpServer = {
	name: string;
	createdAt: string;
	apps: App[];
};

export function Server(props: McpServer) {
	return (
		<Accordion type="multiple" className="rounded-2xl border px-3">
			<AccordionItem value="item-1">
				<AccordionTrigger className="items-center px-1">
					<div className="flex w-full justify-between">
						<div className="flex items-center gap-2">
							<h1 className="text-primary-800">{props.name}</h1>
							<span className="text-primary-300">/</span>
							<p className="text-primary-300 text-sm">{props.createdAt}</p>
						</div>
						<div className="flex gap-3">
							<EditServer />
							<Separator orientation="vertical" />
						</div>
					</div>
				</AccordionTrigger>
				<AccordionContent className="rounded-md bg-primary-25">
					{props.apps.map((app) => (
						<ServerApp key={app.name} {...app} />
					))}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

function EditServer() {
	return (
		<Button
			variant={"secondary"}
			className="shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
		>
			Edit
			<Edit />
		</Button>
	);
}

export function ServerList({ data }: { data: McpServer[] }) {
	return (
		<div className="flex w-full flex-col gap-y-3">
			{data.map((server) => (
				<Server key={server.name} {...server} />
			))}
		</div>
	);
}

function ServerApp(props: App) {
	return (
		<div className="flex h-[72px] w-full items-center justify-between border-b border-b-primary-100 p-4">
			<div className="flex items-center gap-3">
				<img width={36} height={36} src={props.icon} alt={props.name} />
				<div className="flex flex-col text-sm">
					<p className="font-medium text-primary-800">{props.name}</p>
					<p className="text-primary-300 text-xs">
						{props?.scopes} scopes allowed
					</p>
				</div>
			</div>

			{props?.isAuthenticated ? (
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
