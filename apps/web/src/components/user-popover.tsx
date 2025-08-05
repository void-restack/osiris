import { LogOut, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAuthenticated } from "@/lib/auth-optimized";
import { ICONS } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { userQueries } from "@/lib/queries";
import { useLogoutMutation } from "@/lib/mutations";
import { toast } from "sonner";

export function UserPopover() {
  const [isOpen, setIsOpen] = useState(false);

  // Only fetch user data if authenticated (this should always be true when this component renders)
  const { data: user } = useSuspenseQuery(userQueries.meOptions(isAuthenticated()));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="flex h-12 cursor-pointer items-center justify-start rounded-[8px] border border-primary-100 border-dashed bg-white text-foreground hover:bg-white hover:text-foreground"
          variant={"default"}
        >
          <div className="flex items-center gap-3">
            <Avatar className="rounded-sm bg-[#EEEEEE]">
              <AvatarImage src={user.profileImageUrl} alt={user.name} />
              <AvatarFallback className="rounded-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <h3 className="text-[#171717] font-medium">{user.name}</h3>
              <p className="text-[#A3A3A3] text-xs">{user.email}</p>
            </div>
          </div>
          <ICONS.upDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="PopoverContent mb-2 flex w-[248px] flex-col rounded-[6px] border-none bg-white p-0 shadow-none"
        align="start"
      >
        <Profile user={user} />
        <Separator />
        <Logout onLogout={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function Profile({ user }: { user: any }) {
  return (
    <Button
      variant={"ghost"}
      className="h-8 w-full cursor-pointer justify-start px-3 py-2 hover:bg-transparent"
    >
      <User className="mr-2 h-4 w-4" />
      <div className="flex flex-col items-start">
        {/* <span className="text-sm font-medium">Profile</span> */}
        <span className="text-xs text-muted-foreground capitalize">
          {user.role.replace('_', ' ')}
        </span>
      </div>
    </Button>
  );
}

function Logout({ onLogout }: { onLogout: () => void }) {
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      onLogout();
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <Button
      variant={"ghost"}
      className="h-8 w-full cursor-pointer justify-start bg-transparent px-3 py-2 text-[#FF7373] hover:bg-[#FFF8F8] hover:text-[#FF7373]"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {logoutMutation.isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
