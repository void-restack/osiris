import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { McpVersions } from "./mcp-versions";
import { InstallAction } from "./install-action";

export function McpDetailsHeader({}: {}) {
  return (
    <section className="flex flex-col w-full">
      <div className="relative">
        <img
          src={"/test/banner.svg"}
          className="object-cover h-[160px] w-full"
        />
        <Avatar className="size-[72px] rounded-[4px] border border-primary-00 p-0 relative bottom-10 left-6">
          <AvatarImage src={"/test/avatar.svg"} />
          <AvatarFallback className="text-2xl">B</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex justify-between -mt-6 px-6">
        <div className="w-full gap-y-2">
          <h1 className="text-xl text-primary-800">Browser Base</h1>
          <p className="text-primary-300">@browserbasehq/mcp-stagehand</p>
        </div>
        <div className="flex items-center gap-4">
          <McpVersions
            versions={[
              {
                version: "1.0.0",
                id: 1,
              },
              {
                version: "1.0.1",
                id: 2,
              },
            ]}
          />
          <InstallAction />
        </div>
      </div>
    </section>
  );
}
