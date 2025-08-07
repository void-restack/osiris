import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import HubLayout from "@/components/layouts/hub-layout";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AuthHeader } from "@/components/auth-header";

export const Route = createFileRoute("/_hub")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <HubLayout>
      <header className="flex h-[86px] shrink-0 items-center justify-between gap-2 border-b border-b-primary-100 pr-4">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <DynamicBreadcrumb />
        </div>
        <AuthHeader />
      </header>
      <div className="h-full w-full overflow-y-hidden">
        <Outlet />
      </div>
    </HubLayout>
  );
}
