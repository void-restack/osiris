import { WalletIcon } from "lucide-react";
import { Button } from "./ui/button";

export function Wallet() {
	return (
		<Button
			variant={"secondary"}
			size={"icon"}
			className="flex h-8 cursor-pointer items-center gap-1 rounded-6px text-sm"
		>
			<WalletIcon stroke="#A3A3A3" />
		</Button>
	);
}
