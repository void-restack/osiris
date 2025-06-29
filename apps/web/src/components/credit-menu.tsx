import { ArrowUpDown, ChevronDown, Plus } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";

export function CreditsMenu({ credits }: { credits: number }) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={"secondary"}
					className="flex h-8 min-w-[130px] cursor-pointer items-center gap-1 rounded-6px text-sm"
				>
					<span className="text-[#171717]">{credits}</span>
					<span className="text-[#A3A3A3]">Credits</span>
					<ChevronDown className="h-[14px] w-[14px] stroke-[#A3A3A3]" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="mt-2 flex max-w-[140px] flex-col rounded-[6px] border-none p-0 shadow-none">
				<AddCredits />
				<TxHistory />
			</PopoverContent>
		</Popover>
	);
}

export function AddCredits() {
	return (
		<Button
			variant={"ghost"}
			className="h-8 w-full cursor-pointer justify-start hover:border"
		>
			<Plus className="stroke-success-500" />
			Add Credits
		</Button>
	);
}

export function TxHistory() {
	return (
		<Button
			variant={"ghost"}
			className="h-8 w-full cursor-pointer justify-start"
		>
			<ArrowUpDown className="stroke-success-500" />
			Trx History
		</Button>
	);
}
