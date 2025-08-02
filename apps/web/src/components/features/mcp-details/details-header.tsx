import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { McpVersions } from "./mcp-versions";
import { PackageDialog } from "../mcp-list/package-dialog";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import type { Package } from "@/types";
import { Button } from "@/components/ui/button";

export function McpDetailsHeader({ mcp }: {
	mcp: Package
}) {
	return (
		<section className="flex w-full flex-col px-6">
			<div className="relative">
				<img
					src={"/test/banner.svg"}
					className="h-[160px] w-full object-cover"
					alt="mcp banner"
				/>
				<Avatar className="relative bottom-10 left-6 size-[72px] rounded-[4px] border border-primary-00 p-0">
					<AvatarImage src={"/test/avatar.svg"} />
					<AvatarFallback className="text-2xl">B</AvatarFallback>
				</Avatar>
			</div>
			<div className="-mt-6 flex justify-between px-6">
				<div className="w-full gap-y-2">
					<h1 className="text-primary-800 text-xl">Browser Base</h1>
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
					<PackageDialog  package={mcp}  />
				</div>
			</div>
		</section>
	);
}
