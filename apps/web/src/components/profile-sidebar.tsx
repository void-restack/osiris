import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { userQueries } from "@/lib/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function ProfileSidebar() {
  const { closeProfileSidebar, isProfileSidebarOpen, selectedProfileId, setSelectedProfile } = useAppStore();

  const { data: profiles, isLoading, error } = useQuery(userQueries.profilesOptions());

  if (!isProfileSidebarOpen) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold">User Profiles</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeProfileSidebar}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load profiles
            </p>
          </div>
        ) : !profiles || profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No profiles found
            </p>
          </div>
        ) : (
          <RadioGroup
            value={selectedProfileId || undefined}
            onValueChange={(value) => setSelectedProfile(value || null)}
            className="space-y-3"
          >
            {profiles.map((profile: { id: string; name: string; imageUrl: string | null; createdAt: string }) => {
              const radioId = `profile-${profile.id}`;
              const isSelected = selectedProfileId === profile.id;
              return (
                <div
                  key={profile.id}
                  className={cn(
                    "flex items-start space-x-3 group border border-primary-100 rounded-[6px] relative p-2 cursor-pointer",
                    isSelected && "border-primary-500"
                  )}
                >
                  <RadioGroupItem
                    id={radioId}
                    value={profile.id}
                    className="mt-1 absolute top-2 right-2 cursor-pointer"
                  />
                  <label
                    htmlFor={radioId}
                    className="flex-1"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="size-8 rounded-[6px] shadow-xl">
                        <AvatarImage src={profile.imageUrl || undefined} alt={profile.name} className="rounded-[6px]" />
                        <AvatarFallback className="font-bold text-lg capitalize rounded-[6px]">
                          {profile.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-primary-800">
                          {profile.name}
                        </p>
                        <p className="text-[13px] text-primary-400">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </RadioGroup>
        )}
      </ScrollArea>
    </div>
  );
}
