import { createFileRoute, Link } from "@tanstack/react-router";
import HubLayout from "@/components/layouts/hub-layout";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserPopover } from "@/components/user-popover";
import { ArrowRight, FileText, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeBaseCard } from "@/components/features/knowledge-base/knowledge-base-card";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const isLoggedIn = false
  return (
    <HubLayout>
      <header className="flex h-[86px] shrink-0 items-center justify-between gap-2 border-b border-b-primary-100 pr-4">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          Profile
        </div>
        <UserPopover />
      </header>
      <div className="hidebar h-full w-full overflow-y-scroll pb-8">
        {isLoggedIn ?
          <div className="pt-10 px-8 flex w-full">
            <div className="w-full flex items-center justify-between">
              <div className="flex flex-col items-start">
                <h2 className="text-[32px]">1,20,323 <span className="text-primary-300">(~$12.32)</span></h2>
                <span className="text-[13px] text-primary-300">Osiris Credit Balance</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-[52px] w-[174px] flex bg-primary-50 rounded-[8px] items-center px-2 gap-[12px]">
                  <div className="bg-purple-300 size-8 rounded-md " />
                  <div className="flex flex-col">
                    <h3 className="text-sm truncate">Piyush Jain</h3>
                    <p className="text-[13px] truncate text-primary-300">piyush@gmail.com</p>
                  </div>
                </div>
                <div className="h-[52px] w-[30px] bg-primary-800 flex items-center justify-center rounded-[8px] inset-shadow-search-btn">
                  <PlusIcon className="text-primary-00 size-4" />
                </div>
              </div>
            </div>
          </div>
          :
          <div className="w-full px-8 pt-16">
            <div className="border border-dashed border-primary-100 rounded-[16px] mb-16 py-[34px] px-6 w-full relative overflow-hidden">
              <h2 className="text-xl font-medium">Get the best out of Osiris</h2>
              <p className="text-primary-400 text-sm">Just three easy steps, and you’re all set to kick off & grow hub</p>

              <div className="flex items-center gap-4 mt-20">
                <Button icon={ArrowRight} iconPlacement="right" size="sm">Take a tour</Button>
                <Button icon={FileText} iconPlacement="left" variant="outline" size="sm">Read docs</Button>
              </div>

              <img src="/homepage.svg" className="absolute bottom-0 -right-2" />
            </div>

            <div>
              <div className="flex items-center justify-between w-full mb-6">
                <div className="flex flex-col">
                  <h2 className="text-xl font-medium">Trending Knowledge Bases</h2>
                  <span className="text-primary-400 text-sm">A subtitle to this header, MCPS.</span>
                </div>

                <Link to="#" className="flex items-center gap-1 text-[16px] text-primary-400">
                  View More <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 w-full lg:grid-cols-3 gap-6">
                <KnowledgeBaseCard
                  description="Customer feedback data knowledge system "
                  title="Browser Hub"
                  banner="/test/k.banner.svg"
                  link="/test/k.link"
                  logo="/test/k.logo.svg"
                />
                <KnowledgeBaseCard
                  description="Customer feedback data knowledge system "
                  title="Browser Hub"
                  banner="/test/k.banner.svg"
                  link="/test/k.link"
                  logo="/test/k.logo.svg"
                />
                <KnowledgeBaseCard
                  description="Customer feedback data knowledge system "
                  title="Browser Hub"
                  banner="/test/k.banner.svg"
                  link="/test/k.link"
                  logo="/test/k.logo.svg"
                />
              </div>
            </div>
          </div>
        }
      </div>
    </HubLayout >
  );
}
