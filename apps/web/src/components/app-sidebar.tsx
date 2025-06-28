import { Link } from "@tanstack/react-router";
import { BookOpen, Bot, Settings2, SquareTerminal } from "lucide-react";
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
import Logo from "../../public/logo.svg";
import { UserPopover } from "./user-popover";

const data = {
	navMain: [
		{
			title: "Home",
			url: "#",
			icon: SquareTerminal,
			isActive: true,
		},
		{
			title: "AuthHub",
			url: "#",
			icon: Bot,
		},
		{
			title: "MCP Hub",
			url: "#",
			icon: BookOpen,
		},
		{
			title: "Profile",
			url: "#",
			icon: Settings2,
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings2,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader className="flex min-h-[86px] w-full items-center justify-center border-b border-b-primary-100">
				<SidebarMenu className="justify-center-safe flex h-full w-full">
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Link to="/">
										<img src={Logo} alt="Osiris Hub" />
									</Link>
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold text-lg">Osiris</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<UserPopover />
			</SidebarFooter>
		</Sidebar>
	);
}
