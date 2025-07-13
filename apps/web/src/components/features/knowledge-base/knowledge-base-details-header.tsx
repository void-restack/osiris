import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AddSeedsAction } from "./add-seed";

export function KnowledgeBaseDetailsHeader() {
	return (
		<section className="flex w-full flex-col px-6">
			<div className="relative">
				<img
					src={"/test/k.banner.svg"}
					className="h-[160px] w-full object-cover"
					alt="mcp banner"
				/>
				<Avatar className="relative bottom-10 left-6 size-[72px] rounded-[4px] border border-primary-00 p-0">
					<AvatarImage src={"/test/k.logo.svg"} />
					<AvatarFallback className="text-2xl">B</AvatarFallback>
				</Avatar>
			</div>
			<div className="-mt-6 flex justify-between px-6">
				<div className="w-full gap-y-2">
					<h1 className="text-primary-800 text-xl">Yeet - Gamble protocol</h1>
					<p className="text-primary-300">
						Built for big moments | YEET it | 18+
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Button className="text-primary-300" variant={"secondary"}>
						last updated: 3mo ago
					</Button>
					<AddSeedsAction />
				</div>
			</div>
		</section>
	);
}
