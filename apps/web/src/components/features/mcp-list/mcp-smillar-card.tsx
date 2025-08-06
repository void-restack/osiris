import { ICONS } from "@/components/icons";
import { McpCardIcon, type McpCardProps } from "./mcp-card";

export function McpSimilarCard(props: McpCardProps) {
    return (
        <div className="flex w-full max-w-md items-center gap-3 rounded-[12px] border p-3 shadow">
            <McpCardIcon icon={props.icon} />
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h2 className="font-medium text-[#171717]">{props.title}</h2>
                    {props.isVerified && (
                        <ICONS.verifiedBadge className="size-[14px] shrink-0" />
                    )}
                </div>
                <p className="text-[#A3A3A3] text-sm">@{props.userHandle}</p>
            </div>
        </div>
    );
}

export function McpSimilarCardList({
    similarMcps,
}: {
    similarMcps: McpCardProps[];
}) {
    return (
        <div className="flex w-full flex-col items-center gap-3 pt-10">
            {similarMcps.map((mcp) => (
                <McpSimilarCard key={mcp.title} {...mcp} />
            ))}
        </div>
    );
}
