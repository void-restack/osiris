import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import HubLayout from "@/components/layouts/hub-layout";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserPopover } from "@/components/user-popover";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
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
				<UserPopover />
			</header>
			<div className="hidebar h-full w-full overflow-y-scroll pb-8">
				<Outlet />
			</div>
		</HubLayout>
	);
}
