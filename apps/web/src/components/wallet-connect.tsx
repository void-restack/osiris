import { WalletIcon } from "lucide-react";
import { Button } from "./ui/button";

export function Wallet() {
  return (
        <Button variant={"ghost"} size={"icon"} className="bg-popover hover:bg-popover cursor-pointer flex items-center gap-1  rounded-6px h-8 text-sm">
            <WalletIcon stroke="#A3A3A3" />
        </Button>
  )
}