import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type McpTagProps = {
	icon?: string;
	tag: string;
};

export function McpTag({
	icon,
	tag,
	className,
	...props
}: McpTagProps & ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex h-[26px] items-center gap-1.5 rounded-[6px] bg-primary-50 px-2 text-primary-700 text-sm",
				className,
			)}
			{...props}
		>
			{icon && <img src={icon} alt={tag} width={10} height={10} />}
			<span>{tag}</span>
		</div>
	);
}

export function McpTagList({
	tags,
	className,
}: {
	tags: McpTagProps[];
	className?: string;
}) {
	return (
		<div className={cn("flex items-center gap-4")}>
			{tags.map((tag) => (
				<McpTag key={tag.tag} {...tag} className={className} />
			))}
		</div>
	);
}
