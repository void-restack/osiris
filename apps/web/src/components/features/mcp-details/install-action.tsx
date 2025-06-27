import { Button } from "@/components/ui/button";
import { ArrowUpRight, Download } from "lucide-react";

export function InstallAction() {
  return (
    <Button>
      Instal
      <Download className="w-4 h-4" />
    </Button>
  );
}
