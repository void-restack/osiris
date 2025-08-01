import { Star } from "lucide-react";
import { ICONS } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { KnowledgeBase } from "@/types";

export function KnowledgeBaseCard({
  name,
  description,
  coverImageUrl,
  isPublic,
  publicMetadata,
  tags,
  createdAt,
  updatedAt,
  knowledgeBaseId
}: KnowledgeBase) {
  return (
    <section className="flex flex-col gap-y-4 relative">
      <div className="relative h-[120px]">
        <img
          className="h-[120px] w-full rounded-[8px] object-cover object-center"
          src={coverImageUrl ?? ""}
          alt={name}
        />
        <div className="absolute top-0 right-0 bottom-0 left-0 rounded-[8px] bg-black/10">
          <Avatar className="absolute bottom-4 left-4 size-12 rounded-[4px] border border-primary-00 p-0">
            <AvatarImage src={coverImageUrl ?? ""} />
            <AvatarFallback className="text-2xl">B</AvatarFallback>
          </Avatar>
          <div className="absolute top-4 right-4 flex gap-2">
            <KnowledgebaseStars stars={0} />
            <KnowledgebaseCredits credits={publicMetadata?.price ?? 0} />
          </div>
        </div>
      </div>
      <div className="px-3">
        <h1 className="flex items-center gap-1 font-medium text-primary-800">
          {name}
          {isPublic && (
            <span>
              <ICONS.verifiedBadge />
            </span>
          )}
        </h1>
        <p className="line-clamp-1 text-primary-300 text-sm">{description}</p>
      </div>
        <Link to={`/knowledge/${knowledgeBaseId}`}>

      <span className="absolute w-full h-full inset-0"></span>
		</Link>
    </section>
  );
}

function KnowledgebaseStars({ stars }: { stars: number }) {
  return (
    <div
      className={cn(
        "flex h-7 items-center gap-2.5 rounded-[6px] px-2 py-[2px] font-medium text-sm drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]",
        "bg-primary-00 text-primary-400"
      )}
    >
      <Star className="size-4" />
      <span>{stars}</span>
    </div>
  );
}

function KnowledgebaseCredits({ credits }: { credits: number }) {
  const isFree = credits === 0;
  const tag = isFree ? "Free" : `${credits}`;
  return (
    <div
      className={cn(
        "flex h-7 items-center gap-2.5 rounded-[6px] px-2 py-[2px] font-medium text-sm drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]",
        isFree
          ? "bg-primary-00 text-primary-400"
          : "bg-[#2DCA04] text-primary-00"
      )}
    >
      {!isFree && <img src="/credit.svg" alt="credit" className="h-4 w-4" />}
      <span>{tag}</span>
    </div>
  );
}
