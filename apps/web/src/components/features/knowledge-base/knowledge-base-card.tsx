import { ICONS } from "@/components/icons";
import { McpTag } from "@/components/tag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type KnowledgeBaseCardProps = {
	title: string;
	description: string;
	image: string;
	link: string;
};

export function KnowledgeBaseCard({
	title,
	description,
	image,
	link,
}: KnowledgeBaseCardProps) {
	return (
		<section>
			<div className="relative h-[120px]">
				<img
					height={120}
					className="w-full rounded-[8px]"
					src={image}
					alt={title}
				/>
				<Avatar className="relative bottom-10 left-6 size-[72px] rounded-[4px] border border-primary-00 p-0">
					<AvatarImage src={"/test/k.logo.svg"} />
					<AvatarFallback className="text-2xl">B</AvatarFallback>
				</Avatar>
				<div className="">
					<KnowledgebaseStars />
					<KnowledgebaseCredits credits={10} />
				</div>
			</div>
			<div className="flex flex-col gap-y-1">
				<h1 className="flex items-center gap-1 font-medium text-primary-800">
					{title}{" "}
					<span>
						<ICONS.verifiedBadge />
					</span>
				</h1>
				<p className="line-clamp-1 text-primary-300">{description}</p>
			</div>
		</section>
	);
}

function KnowledgebaseStars() {
	return (
		<McpTag
			className="h-7 rounded-sm font-medium text-sm drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]"
			icon="/star.svg"
			tag="4.5"
		/>
	);
}

function KnowledgebaseCredits({ credits }: { credits: number }) {
	const isFree = credits === 0;
	const tag = isFree ? "Free" : `${credits} credits`;
	return (
		<McpTag
			className={cn(
				"h-7 rounded-sm font-medium text-sm drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]",
				isFree
					? "bg-primary-00 text-primary-400"
					: "bg-success-600 text-primary-00",
			)}
			icon={!isFree ? "/credit.svg" : undefined}
			tag={tag}
		/>
	);
}
