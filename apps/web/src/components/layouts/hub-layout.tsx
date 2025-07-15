import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
import { EditDatabaseSidebar } from "../edit-sidebar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
	const { isEditSidebarOpen } = useAppStore();

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className={isEditSidebarOpen ? "flex-1" : ""}>
				{children}
			</SidebarInset>
			{isEditSidebarOpen && (
				<SidebarInset className="w-full max-w-sm border-primary-100 border-l bg-white">
					<EditDatabaseSidebar />
				</SidebarInset>
			)}
		</SidebarProvider>
	);
}
