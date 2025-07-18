"use client";

import { ICONS } from "@/components/icons";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";

export function BrowseKnowledgeBase() {
	return (
		<div className="mx-auto mt-8 w-full pb-14 text-center">
			<h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
				Browse Knowledge Hubs
			</h2>
			<span className="text-primary-300 text-sm">
				Search across various of authentication hubs on osiris
			</span>
			<Autocomplete
				className="mt-6"
				onSearch={() => []}
				emptyText="No countries found."
				footerText="Footer text"
				bottomLeftContent={
					<div className="flex items-center gap-3">
						<div className="rounded-md border border-primary-100 bg-primary-00 p-1.5 text-xs">
							Google
						</div>
						<div className="rounded-md border border-primary-100 bg-primary-00 p-1.5 text-xs">
							Github
						</div>
					</div>
				}
				bottomRightContent={
					<div>
						<UploadFile />
						<Retry />
					</div>
				}
			/>
		</div>
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

export function Retry() {
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
