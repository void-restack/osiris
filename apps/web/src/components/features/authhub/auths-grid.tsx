import { BadgeCheck } from "lucide-react";
import { AuthMethodDialog } from "./auth-method-dialog";
import type { ServiceClient } from "@/types/auth";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isAuthenticated } from "@/lib/auth-optimized";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuthGridViewProps {
  methods: ServiceClient[];
}

export function AuthGridView({ methods }: AuthGridViewProps) {
  const authenticated = isAuthenticated();

  return (
    <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 pb-8 lg:grid-cols-3">
        {methods.map((method: ServiceClient) => (
          <div
            key={method.clientId}
            className="relative group h-fit min-h-52 rounded-xl border border-primary-100 p-6 transition-all hover:border-primary-200 hover:shadow-md block cursor-pointer"
            style={{ zIndex: 0 }}
            aria-label={`Go to ${method.name}`}
            tabIndex={0}
            role="link"
            onClick={e => {
              if (e.defaultPrevented) return;
              // @ts-ignore
              if (e.target.closest('.auth-method-dialog-trigger')) return;
            }}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                // @ts-ignore
                if (e.target.closest('.auth-method-dialog-trigger')) return;
              }
            }}
          >
            <Link
              to={`/auth/${method.clientId}`}
              className="absolute inset-0 z-10"
              aria-label={`Go to ${method.name}`}
              tabIndex={-1}
              style={{ pointerEvents: "auto" }}
            />
            {/* Card Content */}
            <div className="relative z-20 pointer-events-none">
              {/* Header */}
              <div className="mb-4 flex w-full items-start justify-between">
                <div className="flex flex-col items-start gap-3">
                  <Avatar className="size-12 rounded-[6px]">
                    <AvatarImage
                      src={method.iconUrl ?? undefined}
                      alt={method.name}
                      className="rounded-[6px] bg-transparent"
                    />
                    <AvatarFallback className="rounded-[6px]">
                      {method.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <h4 className="font-medium text-primary-800 capitalize flex items-center gap-1">
                      {method.name}
                      <BadgeCheck className="size-4 stroke-white fill-green-500" />
                    </h4>
                    <p className="text-[13px] text-primary-300">{Object.keys(method.scopeDefinitions).length} Scopes</p>
                  </div>
                </div>
                {authenticated && (
                  <div
                    className="relative z-30 pointer-events-auto auth-method-dialog-trigger"
                    onClick={e => {
                      e.stopPropagation();
                    }}
                    onMouseDown={e => {
                      e.stopPropagation();
                    }}
                  >
                    <AuthMethodDialog method={method} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-3">
                <p className="text-primary-300 text-sm line-clamp-2 leading-relaxed">
                  {method.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>

  );
}
