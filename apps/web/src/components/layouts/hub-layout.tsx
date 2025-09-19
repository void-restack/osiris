import type React from "react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouteChangeListener } from "@/hooks/use-route-change-listener";
import { useAppStore } from "@/lib/store";
import { EditConnectionSidebar } from "../edit-sidebar";
import { McpServerEditSidebar } from "../mcp-server-edit-sidebar";
import { OAuthClientEditSidebar } from "../oauth-client-edit-sidebar";
import { WorkflowEditSidebar } from "../workflow-edit-sidebar";
import { WorkflowExecutionSidebar } from "../workflow-execution-sidebar";
import { MainChatSidebar } from "../main-chat-sidebar";
import { FloatingChatButton } from "../floating-chat-button";
import { useLocation } from "@tanstack/react-router";

function HubLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    isEditSidebarOpen,
    closeEditSidebar,
    isMcpServerEditSidebarOpen,
    closeMcpServerEditSidebar,
    isOAuthClientEditSidebarOpen,
    closeOAuthClientEditSidebar,
    isWorkflowEditSidebarOpen,
    closeWorkflowEditSidebar,
    isWorkflowExecutionSidebarOpen,
    closeWorkflowExecutionSidebar,
    isMainChatSidebarOpen,
    setSidebarOpenCallback
  } = useAppStore();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Check if we're on the index page
  const isIndexPage = location.pathname === "/";

  useRouteChangeListener();

  useEffect(() => {
    setSidebarOpenCallback(setOpen);
  }, [setOpen, setSidebarOpenCallback]);

  // Auto-open sidebar on index page, auto-close on other pages
  useEffect(() => {
    if (isIndexPage) {
      const { openMainChatSidebar } = useAppStore.getState();
      openMainChatSidebar();
    } else {
      const { closeMainChatSidebar } = useAppStore.getState();
      closeMainChatSidebar();
    }
  }, [isIndexPage]);

  return (
    <>
      <AppSidebar />
      <SidebarInset className={(isEditSidebarOpen || isWorkflowEditSidebarOpen || isWorkflowExecutionSidebarOpen || (isMainChatSidebarOpen && isIndexPage)) && !isMobile ? "flex-1" : ""}>
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
      {isOAuthClientEditSidebarOpen && !isMobile && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <OAuthClientEditSidebar />
        </SidebarInset>
      )}
      {isWorkflowEditSidebarOpen && !isMobile && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <WorkflowEditSidebar />
        </SidebarInset>
      )}
      {isWorkflowExecutionSidebarOpen && !isMobile && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <WorkflowExecutionSidebar />
        </SidebarInset>
      )}
      {isMainChatSidebarOpen && !isMobile && (
        <SidebarInset className="w-full max-w-[448px] border-primary-100 border-l bg-white md:w-[448px]">
          <MainChatSidebar />
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
          <Drawer open={isOAuthClientEditSidebarOpen} onOpenChange={(open) => !open && closeOAuthClientEditSidebar()}>
            <DrawerContent className="h-[90vh]">
              <OAuthClientEditSidebar />
            </DrawerContent>
          </Drawer>
          <Drawer open={isWorkflowEditSidebarOpen} onOpenChange={(open) => !open && closeWorkflowEditSidebar()}>
            <DrawerContent className="h-[90vh]">
              <WorkflowEditSidebar />
            </DrawerContent>
          </Drawer>
          <Drawer open={isWorkflowExecutionSidebarOpen} onOpenChange={(open) => !open && closeWorkflowExecutionSidebar()}>
            <DrawerContent className="h-[90vh]">
              <WorkflowExecutionSidebar />
            </DrawerContent>
          </Drawer>
        </>
      )}

      {/* Floating chat button for non-index pages */}
      {!isIndexPage && <FloatingChatButton />}
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
