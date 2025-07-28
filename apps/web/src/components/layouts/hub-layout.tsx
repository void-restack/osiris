import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
import { EditConnectionSidebar } from "../edit-sidebar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const { isEditSidebarOpen } = useAppStore();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={isEditSidebarOpen ? "flex-1" : ""}>
        {children}
      </SidebarInset>
      {isEditSidebarOpen && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <EditConnectionSidebar />
        </SidebarInset>
      )}
    </SidebarProvider>
  );
}
