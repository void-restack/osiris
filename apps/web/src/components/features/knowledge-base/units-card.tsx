import {  FileText, ExternalLink, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Unit, Source } from "./use-units-filters";

export interface UnitsCardProps {
  unit: Unit;
  source: Source | null;
  onClick: () => void;
}

export function UnitsCard({ unit, source, onClick }: UnitsCardProps) {
  const getSourceIcon = () => {
    if (!source) return <FileText className="stroke-primary-300 size-3" />;
    
    switch (source.sourceType) {
      case 'file':
        return <FileText className="stroke-primary-300 size-3" />;
      case 'url':
        return <ExternalLink className="stroke-primary-300 size-3" />;
      case 'youtube_url':
        return <div className="size-3 bg-red-500 rounded-sm flex items-center justify-center text-[6px] text-white font-bold">YT</div>;
      case 'image':
        return <Eye className="stroke-primary-300 size-3" />;
      case 'text':
        return <FileText className="stroke-primary-300 size-3" />;
      default:
        return <FileText className="stroke-primary-300 size-3" />;
    }
  };

  const getDisplaySource = () => {
    if (!source) return "Unknown source";
    
    const maxLength = 30;
    if (source.source.length > maxLength) {
      return source.source.substring(0, maxLength) + "...";
    }
    return source.source;
  };

  const getStatusColor = () => {
    if (!source) return "";
    
    switch (source.processingStatus) {
      case 'completed':
        return "border-green-200";
      case 'processing':
        return "border-yellow-200";
      case 'pending':
        return "border-blue-200";
      case 'failed':
        return "border-red-200";
      default:
        return "";
    }
  };

  return (
    <div 
      className={`relative h-[200px] border-2 border-[#F5F5F5] rounded-[12px] cursor-pointer  transition-colors`}
      onClick={onClick}
    >
      <div className="p-2.5 py-4 h-[87px]">
        <p className="text-primary-300 text-xs line-clamp-5">
          {unit.content.length > 200 
            ? unit.content.substring(0, 200) + "..." 
            : unit.content
          }
        </p>
      </div>
      
      <div className="absolute h-[113px] w-full bottom-0 flex flex-col justify-between overflow-hidden">
        <img src="/union.svg" alt="" className="absolute w-full inset-0 w-fit" />
        
        <div className="relative z-10 px-4 py-1 h-full flex items-center mt-5">
          <h1 className="line-clamp-2 text-sm font-medium">
            {unit.name}
          </h1>
        </div>
        
        <div className="relative z-10 flex items-center justify-between py-2.5 px-[14px] border-t border-t-primary-100">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <p className="line-clamp-1 text-primary-400 text-xs truncate">
              {getDisplaySource()}
            </p>
            {source?.processingStatus === 'failed' && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">
                Error
              </Badge>
            )}
          </div>
          {getSourceIcon()}
        </div>
      </div>
    </div>
  );
}
