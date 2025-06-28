"use client";

import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { ICONS } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";

export function UserPopover() {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className="flex h-12 cursor-pointer items-center justify-start rounded-[8px] bg-white text-foreground hover:bg-white hover:text-foreground"
					variant={"default"}
				>
					<div className="flex items-center gap-3">
						<Avatar className="rounded-sm bg-[#EEEEEE]">
							<AvatarImage />
							<AvatarFallback className="rounded-sm">CN</AvatarFallback>
						</Avatar>
						<div className="text-left">
							<h3 className="text-[#171717]">Akshit Verma</h3>
							<p className="text-[#A3A3A3] text-xs">akshitverma908@gmail.com</p>
						</div>
					</div>
					<ICONS.upDownIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				className="mb-2 flex w-[248px] flex-col rounded-[6px] border-none bg-white p-0 shadow-none"
				align="start"
			>
				<Profile />
				<Separator />
				<Logout />
			</PopoverContent>
		</Popover>
	);
}

function Logout() {
	return (
		<Button
			variant={"ghost"}
			className="h-8 w-full cursor-pointer justify-start bg-transparent px-3 py-2 text-[#FF7373] hover:bg-[#FFF8F8] hover:text-[#FF7373]"
		>
			<LogOut />
			Logout
		</Button>
	);
}

function Profile() {
	return (
		<Button
			variant={"ghost"}
			className="h-8 w-full cursor-pointer justify-start px-3 py-2 hover:bg-transparent"
		>
			<User />
			Profile
		</Button>
	);
}
