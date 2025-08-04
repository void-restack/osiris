import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PackageWithUserStatus } from "@/types";
import { BadgeCheck, User, Download, CheckCircle, ExternalLink, Play } from "lucide-react";
import { PackageDialog } from "./package-dialog";

interface McpGridViewProps {
  packages: PackageWithUserStatus[];
}

export function McpGridView({ packages }: McpGridViewProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <div
          key={pkg.packageId}
          className="group h-fit min-h-[200px] rounded-xl border border-primary-100 p-3 transition-all hover:border-primary-200 hover:shadow-md"
        >
          {/* Header */}
          <div className="mb-4 flex w-full items-start justify-between">
            <div className="flex flex-col items-start gap-3">
              <div className="size-12 rounded-[6px] bg-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-xl">
                {pkg.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <h4 className="font-medium text-primary-800 flex items-center gap-1">
                  {pkg.name}
                  {pkg.isActive && <BadgeCheck className="fill-success-500 stroke-white size-5" />}
                </h4>
                <p className="text-[13px] text-primary-300">v{pkg.latestVersion}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-primary-50 rounded-[6px] py-0.5 px-2 text-[13px] font-medium text-primary-400">
                <User className="size-4" />
                {pkg.metadata?.category || "Assistant"}
              </div>
              <div className="bg-primary-50 rounded-[6px] py-0.5 px-2 text-[13px] font-medium text-primary-400">
                {pkg.metadata?.price > 0 ? `$${pkg?.metadata?.price}` : "FREE"}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <p className="text-primary-300 text-sm line-clamp-2 leading-relaxed">
              {pkg.description}
            </p>

            {/* Tags */}
            {pkg.metadata?.tags && pkg.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pkg.metadata.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs py-0 px-2 text-primary-400">
                    {tag}
                  </Badge>
                ))}
                {pkg.metadata.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs py-0 px-2 text-primary-400">
                    +{pkg.metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {pkg.isInstalled && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  <CheckCircle className="size-3 mr-1" />
                  Installed
                </Badge>
              )}
              {pkg.isDeployed && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                  <ExternalLink className="size-3 mr-1" />
                  Deployed
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            {!pkg.isInstalled ? (
              <PackageDialog
                package={pkg}
                trigger={
                  <Button size="sm" className="flex-1 h-8 text-xs">
                    <Download className="size-3 mr-1" />
                    Install
                  </Button>
                }
              />
            ) : (
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" disabled>
                <CheckCircle className="size-3 mr-1" />
                Installed
              </Button>
            )}

            <Link to={`/mcp/${pkg.packageId}`}>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}