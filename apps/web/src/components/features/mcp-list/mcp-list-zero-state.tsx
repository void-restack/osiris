import { ICONS } from "@/components/icons";

export function McpListZeroState({
  similarMcps,
}: {
  similarMcps: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gapy-3 w-full">
      <ICONS.mcpZeroState />
      <div className="flex flex-col gap-2 text-[#737373] items-center">
        <h1 className="font-medium">No results to show</h1>
        <p className="text-sm text-[#A3A3A3]">
          Looks like it’s a bit empty here. Let’s try a different search!
        </p>
      </div>
      {similarMcps}
    </div>
  );
}