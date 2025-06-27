"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ICONS } from "@/components/icons"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function McpViewToggle() {
    const [view, setView] = useState<"list" | "directory">("list")
    const activeClass = "!bg-white data-[state=on]:!bg-white"
    const inactiveClass = "!bg-transparent"
  

    const handleViewChange = (value: "list" | "directory") => {
        console.log(value)
        setView(value)
    }

    return <ToggleGroup className="bg-[#F5F5F5] p-[2px] rounded-[6px]" type="single" defaultValue="list" onValueChange={handleViewChange}>
        <ToggleGroupItem value="list" className={cn("hover:!bg-white/90", view === "list" ? activeClass : inactiveClass)}>
            <ICONS.list stroke={view === "list" ? "#000000" : "#A3A3A3"} />
        </ToggleGroupItem>
        <ToggleGroupItem value="directory" className={cn("hover:!bg-white/90", view === "directory" ? activeClass : inactiveClass)}>
            <ICONS.directory stroke={view === "directory" ? "#000000" : "#A3A3A3"} />
        </ToggleGroupItem>
    </ToggleGroup>
}