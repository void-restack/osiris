import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { McpDeployDialog } from "@/components/mcp-deploy-dialog";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function McpDetailsHeader() {
  const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
  const { data: packageData } = useSuspenseQuery(packageQueries.detailOptions(mcpId));
  const { isAuthenticated } = useAuth();

  const isDeployed = false;

  const packageWithUserStatus = {
    packageId: mcpId,
    name: packageData?.name || "Unknown Package",
    description: packageData?.description || "",
    publisherId: packageData?.publisherId || "",
    latestVersion: packageData?.latestVersion || "1.0.0",
    iconUrl: packageData?.iconUrl,
    coverImageUrl: packageData?.coverImageUrl,
    paymentConfig: packageData?.paymentConfig,
    isInstalled: false,
    isDeployed,
  };

  return (
    <section className="flex w-full flex-col px-6">
      <div className="relative">
        <img
          src={packageData?.coverImageUrl || "/test/banner.svg"}
          className="h-[160px] w-full object-cover"
          alt="mcp banner"
        />
        <Avatar className="relative bottom-10 left-6 size-[72px] rounded-[4px] border border-primary-00 p-0">
          <AvatarImage src={packageData?.iconUrl || "/test/avatar.svg"} />
          <AvatarFallback className="text-2xl">
            {packageData?.name?.charAt(0).toUpperCase() || "B"}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="-mt-6 flex justify-between px-6">
        <div className="w-full gap-y-2">
          <h1 className="text-primary-800 text-xl">{packageData?.name || "Browser Base"}</h1>
          <p className="text-primary-300 whitespace-nowrap max-w-xs" title={packageData?.publisherId || ""}>
            {packageData?.publisherId || ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* {authenticated && isDeployed && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="size-3" />
                Deployed
              </Badge>
            )} */}
            {isAuthenticated ? (
              <McpDeployDialog
                package={packageWithUserStatus}
                trigger={
                  <Button
                    className="rounded-[6px]"
                  >
                    Deploy
                  </Button>
                }
              />
            ) : (
              null
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
