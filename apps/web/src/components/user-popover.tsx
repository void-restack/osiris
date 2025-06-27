"use client";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ICONS } from "./icons";
import { LogOut, User } from "lucide-react";
import { Separator } from "./ui/separator";

export function UserPopover() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="bg-white flex items-center justify-start cursor-pointer h-12 rounded-[8px] text-foreground hover:bg-white hover:text-foreground" variant={"default"}>
          <div className="flex items-center gap-3">
            <Avatar className="bg-[#EEEEEE] rounded-sm">
              <AvatarImage  />
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
      <PopoverContent side="top" className="flex flex-col p-0 rounded-[6px] shadow-none bg-white mb-2 w-[248px]  border-none" align="start">
        <Profile />
        <Separator />
        <Logout />
      </PopoverContent>
    </Popover>
  );
}


function Logout() {
    return <Button variant={"ghost"} className="w-full justify-start h-8 py-2 bg-transparent hover:bg-[#FFF8F8] text-[#FF7373] hover:text-[#FF7373] cursor-pointer px-3">
        <LogOut />
        Logout
    </Button>
}

function Profile() {
    return <Button variant={"ghost"} className="w-full justify-start h-8 py-2 px-3 cursor-pointer hover:bg-transparent">
        <User />
        Profile
    </Button>
}