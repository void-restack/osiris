import { Button } from "@/components/ui/button";
import { useBuyKnowledgeBaseMutation } from "@/lib/mutations";
import { knowledgeQueries } from "@/lib/queries";
import type { KnowledgeBase } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";

interface BuyKnowledgeBaseButtonProps {
  kb: KnowledgeBase;
}

export function BuyKnowledgeBaseButton({
  kb,
}: BuyKnowledgeBaseButtonProps) {
 
  const buyMutation = useBuyKnowledgeBaseMutation();
  const isFree = kb.publicMetadata.price === 0;
  const { data, isLoading, isPending } = useQuery({
    ...knowledgeQueries.installedOptions(kb.knowledgeBaseId),
  });

  if(isLoading || isPending) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  if(data) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-500">Installed</span>
      </div>
    )
  }
  


  return (
    <>
      <Button
        onClick={() => buyMutation.mutate(kb.knowledgeBaseId)}
        disabled={buyMutation.isPending || data}
      >
        {buyMutation.isPending 
          ? "Loading..."
          : isFree 
            ? "Get Free"
            : `Buy ${kb.publicMetadata.price}`
        }
      </Button>
    </>
  );
}
