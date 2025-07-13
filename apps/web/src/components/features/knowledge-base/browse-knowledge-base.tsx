"use client";

import { Search } from "lucide-react";
import { ICONS } from "@/components/icons";
import { McpTagList } from "@/components/tag";
import { Button } from "@/components/ui/button";

export function BrowseKnowledgeBase() {
	return (
		<section className="flex flex-col gap-6">
			<div className="h-12 w-full" />
			<div className="flex flex-col gap-1 text-center">
				<h2 className="font-medium text-primary-800 text-xl">
					Browse Knowledge Hubs
				</h2>
				<p className="text-primary-300 text-sm">
					Search or add content and let AI transform it to boost efficiency.
				</p>
			</div>
			<div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 rounded-[18px] bg-primary-25 p-4 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
				<div className="relative">
					<textarea
						placeholder="Content creation hubs"
						className="h-[84px] w-full resize-none rounded-[12px] border border-none bg-primary-00 p-4 text-primary-700 placeholder:text-primary-300 focus:outline-none focus:ring-0"
					/>
					<Button
						variant={"secondary"}
						className="-translate-y-1/2 absolute top-1/2 right-4 text-primary-300"
					>
						<span>Search</span>
						<Search className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex justify-between">
					<McpTagList
						className="bg-white text-primary-300"
						tags={[
							{
								tag: "Assistant",
							},
							{
								tag: "Free",
							},
						]}
					/>
					<div className="flex p-0">
						<UploadFile />
						<RetrieveMcp />
					</div>
				</div>
			</div>
		</section>
	);
}

export function UploadFile() {
	return (
		<Button
			className="cursor-pointer hover:text-primary-700"
			variant={"ghost"}
			size={"icon"}
		>
			<ICONS.uploadIcon />
		</Button>
	);
}

export function RetrieveMcp() {
	return (
		<Button
			className="cursor-pointer hover:text-primary-700"
			variant={"ghost"}
			size={"icon"}
		>
			<ICONS.retryIcon className="" />
		</Button>
	);
}
