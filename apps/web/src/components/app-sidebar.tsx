import { Link } from "@tanstack/react-router";
import {
  ExternalLink,
  Wallet,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { isAuthenticated } from "@/lib/auth-optimized";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: () => <Icon name="home" />,
      isActive: true,
    },
    {
      title: "MCP Hub",
      url: "/mcp",
      icon: () => <Icon name="ai" />,
      // items: [
      //   {
      //     title: "X Content",
      //     url: "#",
      //   },
      //   {
      //     title: "Browser Base",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "AuthHub",
      url: "auth",
      icon: () => <Icon name="authfile" />,
    },
    {
      title: "Knowledge Base",
      url: "/knowledge",
      icon: () => <Icon name="doc" />,
    },
    {
      title: "Settings",
      url: "#",
      icon: () => <Icon name="settings" />,
    },
  ],
  navFooter: [
    {
      title: "Docs",
      url: "https://docs.osirislabs.xyz",
      icon: () => <Icon name="doc" />,
      isActive: true,
    },
    {
      title: "Support",
      url: "#",
      icon: () => <Icon name="support" />,
      isActive: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authenticated = isAuthenticated();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="flex min-h-[86px] w-full items-center justify-center border-b border-b-primary-100">
        <SidebarMenu className="justify-center-safe flex h-full w-full">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="hover:bg-transparent"
              size="sm"
              asChild
            >
              <Link to="/">
                <img src="/logo.png" className="size-8" alt="Osiris Hub" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-lg">Osiris</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={data.navFooter} />
        {authenticated && (
          <div className="inset-shadow-credit-card rounded-[6px] bg-white px-2 py-3">
            <p className="mb-2 text-primary-300 text-xs">Available Credits</p>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg text-primary-800">
                00.00 <span className="text-primary-300">(~ $00.00)</span>{" "}
              </span>
              <ExternalLink className="size-4 text-primary-300 hover:text-primary-800" />
            </div>
            <Button
              variant="outline"
              className="w-full text-primary-400"
              icon={Wallet}
              iconPlacement="right"
            >
              Add Funds
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
