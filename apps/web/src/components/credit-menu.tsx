import { ArrowUpDown, ChevronDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "./ui/button";

export function CreditsMenu({ credits }: { credits: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="bg-popover hover:bg-popover cursor-pointer flex items-center gap-1 min-w-[130px] rounded-6px h-8 text-sm">
          <span className="text-[#171717]">{credits}</span>
          <span className="text-[#A3A3A3]">Credits</span>
          <ChevronDown className="h-[14px] w-[14px] stroke-[#A3A3A3]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[140px] border-none mt-2 flex flex-col p-0 rounded-[6px] shadow-none">
          <AddCredits />
          <TxHistory />
      </PopoverContent>
    </Popover>
  );
}

export function AddCredits() {
  return (
    <Button variant={"ghost"} className="w-full justify-start hover:border h-8 cursor-pointer">
        <Plus className="stroke-primary" />
        Add Credits
    </Button>
 );
}

export function TxHistory() {
    return (
        <Button variant={"ghost"} className="w-full justify-start h-8 cursor-pointer">
            <ArrowUpDown className="stroke-primary" />
            Trx History
        </Button>
    )
}