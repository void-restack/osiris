import { ICONS } from "@/components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit } from "lucide-react";

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
    <Accordion type="multiple" className="border rounded-2xl px-3">
      <AccordionItem value="item-1">
        <AccordionTrigger className="items-center px-1">
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-2">
              <h1 className="text-primary-800">{props.name}</h1>
              <span className="text-primary-300">/</span>
              <p className="text-sm text-primary-300">{props.createdAt}</p>
            </div>
            <div className="flex gap-3">
              <EditServer />
              <Separator orientation="vertical" />
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="bg-primary-25 rounded-md">
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
      className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)] shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)]"
    >
      Edit
      <Edit />
    </Button>
  );
}

export function ServerList({ data }: { data: McpServer[] }) {
  return (
    <div className="w-full flex flex-col gap-y-3">
      {data.map((server) => (
        <Server key={server.name} {...server} />
      ))}
    </div>
  );
}

function ServerApp(props: App) {
  return (
    <div className="h-[72px] w-full border-b border-b-primary-100 flex justify-between items-center p-4">
      <div className="flex items-center gap-3">
        <img width={36} height={36} src={props.icon} alt={props.name} />
        <div className="flex flex-col text-sm">
          <p className="font-medium text-primary-800">{props.name}</p>
          <p className="text-xs text-primary-300">
            {props?.scopes} scopes allowed
          </p>
        </div>
      </div>

      {props?.isAuthenticated ? (
        <Button className="cursor-pointer bg-primary-100 text-primary-400 hover:bg-primary-100" size={"sm"} variant={"secondary"}>
          <ICONS.dubbleCheck />
          Authenticated
        </Button>
      ) : (
        <Button  className="cursor-pointer bg-success-50 text-success-500 hover:bg-success-[#2DCA041A]" size={"sm"} variant={"secondary"}>
          <ICONS.codeCheck />
          Authenticate
        </Button>
      )}
    </div>
  );
}
