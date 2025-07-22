import { ICONS } from "@/components/icons";

export function GetStartedAlerts() {
	return (
		<div className="mx-auto flex h-[48px] w-full max-w-3xl flex-row items-center gap-2.5 rounded-[12px] bg-success-25 px-4 py-0 text-sm shadow-[inset_0_0_0_3px_#02B1511A,inset_0_0_0_2px_rgba(255,255,255,0.2)]">
			<ICONS.FolderAi />
			<p className="text-success-600">
				Get started by pasting links, uploading files or simply pasting text.
			</p>
		</div>
	);
}
