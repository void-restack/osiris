import { QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";
import { FullPageLoadingScreen } from "./components/ui/loading-screen";
import type { RouterAppContext } from "./routes/__root";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <FullPageLoadingScreen message="Loading page..." />,
  context: {
    queryClient: queryClient,
    auth: undefined!, // Will be set by root route
  },
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface RouterAppContext {
    router: typeof router;
    breadcrumbLabel?: string;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <RouterProvider router={router} />
          {/* {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
          )} */}
          <Toaster position="top-right" />
        </NuqsAdapter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
