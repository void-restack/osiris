import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Calendar, Tag, FileText, Eye, Check } from "lucide-react";
import type { Unit, Source } from "./use-units-filters";
import { useState } from "react";

interface UnitDetailModalProps {
  unit: Unit | null;
  source: Source | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnitDetailModal({ unit, source, open, onOpenChange }: UnitDetailModalProps) {
  if (!unit) return null;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(unit.content);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'file':
        return <FileText className="size-4" />;
      case 'url':
        return <ExternalLink className="size-4" />;
      case 'youtube_url':
        return <div className="size-4 bg-red-500 rounded-sm flex items-center justify-center text-[8px] text-white font-bold">YT</div>;
      case 'image':
        return <Eye className="size-4" />;
      case 'text':
        return <FileText className="size-4" />;
      default:
        return <FileText className="size-4" />;
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'file':
        return 'File';
      case 'url':
        return 'Website';
      case 'youtube_url':
        return 'YouTube';
      case 'image':
        return 'Image';
      case 'text':
        return 'Text';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/30 text-green-700';
      case 'processing':
        return 'bg-yellow-400/30 text-yellow-700';
      case 'pending':
        return 'bg-blue-400/30 text-blue-700';
      case 'failed':
        return 'bg-red-400/30 text-red-700';
      default:
        return 'bg-gray-400/30 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-primary-25">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold pr-8">
            {unit.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {/* Unit Metadata */}
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-gray-500" />
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm font-medium">
                {new Date(unit.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {source && (
              <div className="flex items-center gap-2">
                {getSourceIcon(source.sourceType)}
                <span className="text-sm text-gray-600">Source:</span>
                <span className="text-sm font-medium truncate max-w-[200px]" title={source.source}>
                  {source.source}
                </span>
                <Badge className={`text-xs ${getStatusColor(source.processingStatus)}`}>
                  {source.processingStatus}
                </Badge>
              </div>
            )}
            
            {unit.type && (
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-gray-500" />
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium">{unit.type}</span>
              </div>
            )}
            
            {source && (
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-gray-500" />
                <span className="text-sm text-gray-600">Source Type:</span>
                <span className="text-sm font-medium">{getSourceTypeLabel(source.sourceType)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {unit.tags.length > 0 && (
            <div className="flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {unit.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Content</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="flex items-center gap-2"
              >
                {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-lg border">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-gray-800">
                {unit.content}
              </pre>
            </div>
          </div>

          {/* Processing Error (if any) */}
          {source?.processingErrorMessage && (
            <div className="flex-shrink-0 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-1">Processing Error</h4>
              <p className="text-sm text-red-600">{source.processingErrorMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}