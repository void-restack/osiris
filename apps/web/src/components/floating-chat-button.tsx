import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
    className?: string;
}

export function FloatingChatButton({ className }: FloatingChatButtonProps) {
    const { isMainChatSidebarOpen, openMainChatSidebar } = useAppStore();

    // Don't show the button when sidebar is open
    if (isMainChatSidebarOpen) {
        return null;
    }

    return (
        <div className={cn("fixed bottom-6 right-6 z-50", className)}>
            <Button
                onClick={openMainChatSidebar}
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary-600 hover:bg-primary-700"
            >
                <MessageCircle className="h-6 w-6 text-white" />
            </Button>
        </div>
    );
}
