"use client";

import type { ComponentProps } from "react";
import { ICONS } from "@/components/icons";
import { McpTagList, type McpTagProps } from "@/components/tag";

export type McpCardProps = {
	title: string;
	description: string;
	tags: McpTagProps[];
	icon: string;
	userHandle: string;
	isVerified: boolean;
};

export function McpCard({
	title,
	description,
	tags,
	userHandle,
	icon,
	isVerified,
}: McpCardProps & ComponentProps<"div">) {
	return (
		<div className="flex max-w-[348px] cursor-pointer flex-col gap-4 rounded-[12px] border p-3 shadow-[inset_0_0_0.7px_0_#0000001C] hover:bg-[#FAFAFA]">
			<div className="flex justify-between">
				<McpCardIcon icon={icon} />
				<McpTagList tags={tags} />
			</div>
			<div className="flex flex-col">
				<div className="flex items-center gap-x-1">
					<h2 className="font-medium text-[#171717]">{title}</h2>
					{isVerified && <ICONS.verifiedBadge className="size-[14px]" />}
				</div>
				<p className="text-[#A3A3A3] text-sm">@{userHandle}</p>
			</div>
			<p className="text-[#A3A3A3] text-sm leading-relaxed">{description}</p>
		</div>
	);
}

export function McpCardIcon({ icon }: { icon: string }) {
	return (
		<img
			style={{
				boxShadow: "4px 8px 24px 0 #0000001C",
				borderRadius: "6px",
			}}
			src={icon}
			alt="MCP Card Icon"
			width={48}
			height={48}
		/>
	);
}
