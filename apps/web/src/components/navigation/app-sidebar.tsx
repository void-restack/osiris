"use client";

import { Link } from "@tanstack/react-router";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { UserPopover } from "@/components/user-popover";
import Logo from "@/public/logo.svg";
import LogoText from "@/public/logo-with-text.svg";

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
];

export function AppSidebar() {
	const { open } = useSidebar();
	return (
		<Sidebar className="p-0" variant="inset" collapsible="icon">
			<SidebarHeader className="flex h-[90px] flex-row items-center justify-start border-b bg-[#F5F5F5] px-9 py-0">
				<Link to="/">
					<img src={open ? LogoText : Logo} alt="Osiris Hub" />
				</Link>
			</SidebarHeader>
			<SidebarContent className="bg-[#F5F5F5] p-0 ">
				<SidebarGroup className="px-5">
					<SidebarGroupContent className="">
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										className="text-[#A3A3A3] text-base"
										asChild
										tooltip={item.title}
									>
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
			<SidebarFooter className="bg-[#F5F5F5] p-5">
				<UserPopover />
			</SidebarFooter>
		</Sidebar>
	);
}
