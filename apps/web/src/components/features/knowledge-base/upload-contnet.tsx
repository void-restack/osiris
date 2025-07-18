"use client";

import { Search, UploadCloud } from "lucide-react";
import { ICONS } from "@/components/icons";
import { McpTagList } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { GetStartedAlerts } from "./get-started-alert";

export function UploadContent() {
	return (
		<section className="flex flex-col gap-5">
			<div className="flex flex-col gap-1 text-center">
				<h2 className="font-medium text-primary-800 text-xl">
					Upload all your content
				</h2>
				<p className="text-primary-300 text-sm">
					Add your content and let AI transform it into a resource that boosts
					your future efficiency.
				</p>
			</div>
			<div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 rounded-[18px] bg-primary-25 p-4 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
				<div className="relative">
					<div className="h-[84px] w-full resize-none rounded-[12px] border border-none bg-primary-50 p-4 text-primary-700 placeholder:text-primary-300 focus:outline-none focus:ring-0">
						MyContent.pdf (23.45MB)
					</div>
					<Button className="-translate-y-1/2 absolute inset-shadow-search-btn top-1/2 right-4">
						<span>Upload</span>
						<UploadCloud />
					</Button>
				</div>
				<div className="flex justify-between">
					<McpTagList
						className="border border-primary-100 bg-transparent text-primary-300"
						tags={[
							{
								tag: "Paste list",
							},
							{
								tag: "Upload files",
							},
							{
								tag: "Paste text",
							},
						]}
					/>
					<div className="flex p-0">
						<UploadFile />
						<RetrieveMcp />
					</div>
				</div>
			</div>
			<GetStartedAlerts />
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
