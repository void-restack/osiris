import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "../index.css";
import type { QueryClient } from "@tanstack/react-query";
import { getAuthState } from "@/lib/auth-utils";

export type RouterAppContext = {
  queryClient: QueryClient;
  auth?: {
    user: any | null;
    isAuthenticated: boolean;
  };
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async ({ context }) => {
    try {
      const auth = await getAuthState(context.queryClient);
      return { auth };
    } catch {
      return { auth: { user: null, isAuthenticated: false } };
    }
  },
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
    </>
  );
}
