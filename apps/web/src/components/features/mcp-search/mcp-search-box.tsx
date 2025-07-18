"use client";

import { ICONS } from "@/components/icons";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";

export function McpSearchBox() {
	return (
		<div className="mx-auto mt-8 w-full pb-14 text-center">
			<h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
				Search across 1000+ MCPs
			</h2>
			<span className="text-primary-300 text-sm">
				Want to write an email, Need Notion Personal Assistant? Search your
				queries
			</span>

			<div className="w-full px-4 md:px-0">
				<Autocomplete
					className="mt-6"
					onSearch={() => []}
					emptyText="No countries found."
					footerText="Footer text"
					bottomLeftContent={
						<div className="flex items-center gap-3">
							<div className="rounded-md bg-primary-100 p-1.5 text-primary-400 text-xs ">
								Notion AI assistant
							</div>

							<div className="rounded-md bg-primary-100 p-1.5 text-primary-400 text-xs">
								Calendar Manager
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
