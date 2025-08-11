import type React from "react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppStore } from "@/lib/store";
import { EditConnectionSidebar } from "../edit-sidebar";
import { McpServerEditSidebar } from "../mcp-server-edit-sidebar";

function HubLayoutInner({ children }: { children: React.ReactNode }) {
  const { isEditSidebarOpen, closeEditSidebar, isMcpServerEditSidebarOpen, closeMcpServerEditSidebar, setSidebarOpenCallback } = useAppStore();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();

  useEffect(() => {
    setSidebarOpenCallback(setOpen);
  }, [setOpen, setSidebarOpenCallback]);

  return (
    <>
      <AppSidebar />
      <SidebarInset className={isEditSidebarOpen && !isMobile ? "flex-1" : ""}>
        {children}
      </SidebarInset>
      {isEditSidebarOpen && !isMobile && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <EditConnectionSidebar />
        </SidebarInset>
      )}
      {isMcpServerEditSidebarOpen && !isMobile && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <McpServerEditSidebar />
        </SidebarInset>
      )}
      {isMobile && (
        <>
          <Drawer open={isEditSidebarOpen} onOpenChange={(open) => !open && closeEditSidebar()}>
            <DrawerContent className="h-[90vh]">
              <EditConnectionSidebar />
            </DrawerContent>
          </Drawer>
          <Drawer open={isMcpServerEditSidebarOpen} onOpenChange={(open) => !open && closeMcpServerEditSidebar()}>
            <DrawerContent className="h-[90vh]">
              <McpServerEditSidebar />
            </DrawerContent>
          </Drawer>
        </>
      )}
    </>
  );
}

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <HubLayoutInner>{children}</HubLayoutInner>
    </SidebarProvider>
  );
}
