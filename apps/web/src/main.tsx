import { createRouter, RouterProvider } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";
import { FullPageLoadingScreen } from "./components/ui/loading-screen";
import { Web3Provider } from "./components/web3-provider";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <FullPageLoadingScreen message="Loading page..." />,
  context: {
    queryClient: queryClient,
    auth: undefined!,
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
      <Web3Provider>
        <NuqsAdapter>
          <RouterProvider router={router} />
        </NuqsAdapter>
      </Web3Provider>
    </React.StrictMode>,
  );
}
