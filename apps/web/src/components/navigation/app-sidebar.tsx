"use client"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Logo from "@/public/logo.svg"
import LogoText from "@/public/logo-with-text.svg"
import { UserPopover } from "@/components/user-popover"
import { Link } from "@tanstack/react-router"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function AppSidebar() {
const {open} = useSidebar()
  return (
    <Sidebar className="p-0" variant="inset" collapsible="icon" >
      <SidebarHeader className="py-0 h-[90px] bg-[#F5F5F5] flex-row px-9 flex justify-start items-center border-b">
        <Link to="/">
          <img src={open ? LogoText : Logo} alt="Osiris Hub" />
        </Link>
        
      </SidebarHeader>
      <SidebarContent className="p-0 bg-[#F5F5F5] ">
        <SidebarGroup className="px-5">
          <SidebarGroupContent className="">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className="text-base text-[#A3A3A3]" asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="p-5 bg-[#F5F5F5]">
        <UserPopover />
      </SidebarFooter>
    </Sidebar>
  )
}