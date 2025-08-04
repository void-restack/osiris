import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadContentDialog } from "./upload-contnet";
import { Route } from "@/routes/_hub/knowledge/$id";
import type { KnowledgeBase } from "@/types";
import { formatRelativeTime } from "@/lib/format";

export function KnowledgeBaseDetailsHeader({ kb }: { kb: KnowledgeBase }) {
	const { id: knowledgeBaseId } = Route.useParams();

	return (
		<section className="flex w-full flex-col px-6">
			<div className="relative">
				<img
					src={kb.coverImageUrl ?? "/test/k.banner.svg"}
					className="h-[160px] w-full object-cover"
					alt="mcp banner"
				/>
				<Avatar className="relative bottom-10 left-6 size-[72px] rounded-[4px] border border-primary-00 p-0">
					<AvatarImage src={kb.iconUrl ?? "/test/k.logo.svg"} />
					<AvatarFallback className="text-2xl">B</AvatarFallback>
				</Avatar>
			</div>
			<div className="-mt-6 flex flex-col gap-4 md:flex-row justify-between px-6">
				<div className="w-full gap-y-2">
					<h1 className="text-primary-800 text-xl">{kb.name}</h1>
					<p className="text-primary-300">
						{kb.description}
					</p>
				</div>
				<div className="flex flex-col md:flex-row items-center gap-4">
					<Button className="text-primary-300 w-full" variant={"secondary"}>
						last updated: {formatRelativeTime(kb.updatedAt)}
					</Button>
					<UploadContentDialog knowledgeBaseId={knowledgeBaseId} />
				</div>
			</div>
		</section>
	);
}
