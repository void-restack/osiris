import { cn } from "@/lib/utils";
import { type ComponentProps } from "react";

export type McpTagProps = {
    icon?: string
    tag: string
}

export function McpTag({ icon, tag, className, ...props }: McpTagProps & ComponentProps<'div'>) {
  return (
    <div className={cn("flex h-[26px] items-center px-2 rounded-[6px] bg-primary-50 text-primary-700 text-sm gap-2.5", className)} {...props}>
        {icon && <img src={icon} alt={tag} width={10} height={10} />}
        <span>{tag}</span>
    </div>
  );
}

export function McpTagList({
    tags,
    className,
}: {
    tags: McpTagProps[]
    className?: string
}) {
    return <div className={cn("flex gap-4 items-center")}>
        {tags.map((tag) => (
            <McpTag key={tag.tag} {...tag} className={className} />
        ))}
    </div>
}