import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "../index.css";
import type { QueryClient } from "@tanstack/react-query";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Osiris",
      },
      {
        name: "description",
        content: "Osiris",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider defaultTheme="light" storageKey="osiris-ui-theme">
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
