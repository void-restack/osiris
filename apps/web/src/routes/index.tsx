import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import HubLayout from "@/components/layouts/hub-layout";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AuthHeader } from "@/components/auth-header";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeBaseCard } from "@/components/features/knowledge-base/knowledge-base-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { knowledgeQueries, packageQueries } from "@/lib/queries";
import { useAppTour } from "@/hooks/use-tour";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: knowledgeBasesData } = useQuery({
    ...knowledgeQueries.basesOptions({ limit: 5 }),
  });

  const { data: packagesData } = useQuery({
    ...packageQueries.popularOptions(),
  });

  const { startTour } = useAppTour();

  return (
    <HubLayout>

      <header className="flex h-[86px] shrink-0 items-center justify-between gap-2 border-b border-b-primary-100 pr-4">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
        </div>
        <AuthHeader />
      </header>

      <div className="hidebar h-full w-full overflow-y-scroll pb-8">
        <div className="w-full px-4 sm:px-8 pt-8 sm:pt-16">
          <div className="border border-dashed border-primary-100 rounded-[16px] mb-8 md:mb-16 py-6 md:py-[34px] px-4 sm:px-6 w-full relative overflow-hidden" data-tour="onboarding-steps">
            <h2 className="text-xl font-medium">Get the best out of Osiris</h2>
            <p className="text-primary-400 text-sm">Just three easy steps, and you're all set to kick off & grow hub</p>

            <div className="flex flex-row items-center gap-4 mt-6 md:mt-20">
              <Button icon={ArrowRight} iconPlacement="right" size="sm" onClick={startTour}>Take a tour</Button>
              <Link to="https://docs.osirislabs.xyz" target="_blank">
                <Button icon={FileText} iconPlacement="left" variant="outline" size="sm">Read docs</Button>
              </Link>
            </div>

            <img src="/homepage.svg" className="hidden md:block absolute bottom-0 -right-2 max-w-[360px]" />
          </div>

          <div data-tour="trending-mcps">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-medium">Trending MCP Packages</h2>
                <span className="text-primary-400 text-sm">Explore the most popular Model Context Protocol packages</span>
              </div>

              <Link to="/mcp" className="flex items-center gap-1 text-[16px] text-primary-400 mt-3 sm:mt-0">
                View More <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid w-full gap-6 [grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
              {packagesData?.data ? (
                packagesData.data.slice(0, 3).map((pkg: any, index: number) => (
                  <Link
                    to={`/mcp/${pkg.id}`}
                    key={pkg.packageId}
                    className="min-h-[200px] group hover:shadow-md transition-shadow duration-200 p-3 inset-shadow-card rounded-xl bg-primary-00 opacity-100 w-full relative overflow-hidden"
                    data-tour={index === 0 ? "first-mcp" : undefined}
                  >
                    <div className="p-0">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
                          <Avatar className="size-12 rounded-md shrink-0">
                            <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
                            <AvatarFallback className="size-12 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                              {pkg.name?.charAt(0).toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-primary-800 truncate">
                              {String(pkg.name).toWellFormed()}
                            </h4>
                            <p className="text-[13px] text-primary-300">
                              v{pkg.latestVersion || '1.0.0'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="secondary" className="text-xs rounded-[6px] text-[13px]">
                            {pkg.type || "MCP"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs uppercase rounded-[6px] text-[13px]">
                            {pkg.paymentConfig ? "Paid" : "Free"}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-primary-400 line-clamp-2">
                          {pkg.shortDescription || pkg.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-h-[200px] p-3 inset-shadow-card rounded-xl bg-primary-00 animate-pulse">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
                        <div className="size-12 rounded-md bg-primary-100" />
                        <div className="min-w-0 flex-1">
                          <div className="h-4 bg-primary-100 rounded mb-2" />
                          <div className="h-3 bg-primary-100 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="h-5 w-12 bg-primary-100 rounded" />
                        <div className="h-5 w-10 bg-primary-100 rounded" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="h-3 bg-primary-100 rounded w-full mb-2" />
                      <div className="h-3 bg-primary-100 rounded w-3/4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-medium">Trending Knowledge Bases</h2>
                <span className="text-primary-400 text-sm">Discover the most popular knowledge bases on Osiris</span>
              </div>

              <Link to="/knowledge" className="flex items-center gap-1 text-[16px] text-primary-400 mt-3 sm:mt-0">
                View More <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid w-full gap-6 [grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
              {knowledgeBasesData?.data ? (
                knowledgeBasesData.data.slice(0, 3).map((kb: any) => (
                  <KnowledgeBaseCard
                    key={kb.knowledgeBaseId}
                    {...kb}
                  />
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-y-4 relative animate-pulse">
                    <div className="relative h-[120px] bg-primary-100 rounded-[8px]" />
                    <div className="px-3">
                      <div className="h-4 bg-primary-100 rounded mb-2" />
                      <div className="h-3 bg-primary-100 rounded w-3/4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* End tour step */}
          <div className="mt-16 text-center" data-tour="end-tour">
            <div className="invisible h-1" />
          </div>
        </div>
      </div>
    </HubLayout>
  );
}
