import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Download,
  Star,
  ExternalLink,
  Calendar,
  User,
  Code,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useInstallPackageMutation } from "@/lib/mutations";
import type { Package as PackageType } from "@/types";

interface PackageDialogProps {
  package: PackageType;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PackageDialog({
  package: pkg,
  trigger,
  open,
  onOpenChange
}: PackageDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const installMutation = useInstallPackageMutation();

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsDialogOpen(newOpen);
    }
  };

  const isOpen = open !== undefined ? open : isDialogOpen;

  const handleInstall = async () => {
    try {
      await installMutation.mutateAsync({
        packageId: pkg.packageId,
        version: pkg.latestVersion,
      });
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to install package:', error);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Package className="size-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-10 rounded-[6px] bg-blue-400 flex items-center justify-center text-white font-bold text-lg">
              {pkg.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold">{pkg.name}</span>
                <Badge variant={pkg.isActive ? "default" : "secondary"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">v{pkg.latestVersion}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pkg.description}
              </p>
            </div>

            {/* Package Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Publisher:</span>
                  <span className="truncate max-w-32" title={pkg.publisherId}>
                    {pkg.publisherId}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  {/* <span>{formatDistanceToNow(new Date(pkg.createdAt), { addSuffix: true })}</span> */}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Code className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Version:</span>
                  <Badge variant="outline" className="text-xs">
                    {pkg.latestVersion}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Settings className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={pkg.isActive ? "default" : "secondary"} className="text-xs">
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            {pkg.metadata?.tags && pkg.metadata.tags.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {pkg.metadata.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {pkg.metadata && Object.keys(pkg.metadata).length > 1 && (
              <div>
                <h3 className="font-medium mb-3">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(pkg.metadata).map(([key, value]) => {
                    if (key === 'tags') return null;
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-right max-w-xs truncate">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <Download className="size-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-lg font-semibold">-</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <Star className="size-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-lg font-semibold">-</div>
                <div className="text-xs text-muted-foreground">Stars</div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <Link to={`/mcp/${pkg.packageId}`}>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="size-4" />
              View Details
            </Button>
          </Link>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              disabled={installMutation.isPending}
              className="gap-2"
            >
              <Download className="size-4" />
              {installMutation.isPending ? "Installing..." : "Install"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
