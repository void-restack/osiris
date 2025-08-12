import { Star, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRateKnowledgeBaseMutation } from "@/lib/mutations";
import { toast } from "sonner";

interface RatingDropdownProps {
  knowledgeBaseId: string;
  currentRating?: number;
  onRatingChange?: (newRating: number) => void;
}

export function RatingDropdown({ 
  knowledgeBaseId, 
  currentRating, 
  onRatingChange 
}: RatingDropdownProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [isOpen, setIsOpen] = useState(false);
  
  const rateMutation = useRateKnowledgeBaseMutation();

  const handleRatingSelect = async (selectedRating: number) => {
    setRating(selectedRating);
    setIsOpen(false);
    
    try {
      await rateMutation.mutateAsync({
        knowledgeBaseId,
        rating: selectedRating,
      });
      
      onRatingChange?.(selectedRating);
      toast.success(`Rated ${selectedRating} stars!`);
    } catch (error) {
      console.error("Failed to rate knowledge base:", error);
      toast.error("Failed to submit rating");
      // Revert the rating if the API call failed
      setRating(currentRating || 0);
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderStars = (count: number, filled: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${
          i < count
            ? filled
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div 
          className="flex h-7 items-center gap-2.5 rounded-[6px] px-2 py-[2px] font-medium text-sm bg-primary-00 text-primary-400 hover:bg-primary-50 cursor-pointer drop-shadow-[0_0_1px_rgba(0,0,0,0.1)] transition-colors"
          onClick={handleDropdownClick}
        >
          <Star className="size-4" />
          <span>{rating || "Rate"}</span>
          <ChevronDown className="size-3 ml-1" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-[100]" onClick={handleDropdownClick}>
        <div className="p-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Rate this knowledge base</div>
          {[1, 2, 3, 4, 5].map((starCount) => (
            <DropdownMenuItem
              key={starCount}
              onClick={() => handleRatingSelect(starCount)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex">
                {renderStars(starCount, true)}
              </div>
              <span className="text-sm text-gray-600">
                {starCount === 1 ? "Poor" : 
                 starCount === 2 ? "Fair" : 
                 starCount === 3 ? "Good" : 
                 starCount === 4 ? "Very Good" : "Excellent"}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
