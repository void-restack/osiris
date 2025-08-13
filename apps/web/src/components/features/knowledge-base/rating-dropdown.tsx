import { Star, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRateKnowledgeBaseMutation } from "@/lib/mutations";
import { toast } from "sonner";
import { Rating, RatingButton } from "@/components/ui/rating";

interface RatingDropdownProps {
  knowledgeBaseId: string;
  currentRating?: number;
  onRatingChange?: (newRating: number) => void;
}

export function RatingDropdown({
  knowledgeBaseId,
  currentRating,
  onRatingChange,
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50">
          <Star className="size-4" />
          <span>{rating}</span>
          <ChevronDown className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-4">
        <div className="space-y-3">
          <Rating
            onChange={(_, value) => {
              handleRatingSelect(value);
            }}
            defaultValue={3}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <RatingButton key={index} />
            ))}
          </Rating>
          <div className="text-xs text-gray-500 text-center">
            Click on a star to rate
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
