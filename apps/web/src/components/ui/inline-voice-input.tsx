import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useVoiceRecording } from "@/hooks/use-voice-recording";

interface InlineVoiceInputProps {
    className?: string;
}

export function InlineVoiceInput({
    className
}: InlineVoiceInputProps) {
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const { isRecording, startRecording, stopRecording } = useVoiceRecording();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isRecording) {
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                className={cn(
                    "group w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isRecording
                        ? "bg-success-100 hover:bg-success-200 text-success-500"
                        : "bg-primary-100 hover:bg-primary-200 text-primary-600"
                )}
                type="button"
                onClick={handleClick}
            >
                {isRecording ? (
                    <div
                        className="w-4 h-4 rounded-sm animate-spin bg-success-500"
                        style={{ animationDuration: "3s" }}
                    />
                ) : (
                    <Mic className="w-4 h-4" />
                )}
            </button>

            {isRecording && (
                <>
                    <span className="font-mono text-xs text-primary-600">
                        {formatTime(time)}
                    </span>

                    <div className="h-2 w-16 flex items-center justify-center gap-0.5">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-0.5 rounded-full transition-all duration-300",
                                    isRecording
                                        ? "bg-success-500 animate-pulse"
                                        : "bg-primary-200 h-1"
                                )}
                                style={
                                    isRecording && isClient
                                        ? {
                                            height: `${20 + Math.random() * 80}%`,
                                            animationDelay: `${i * 0.05}s`,
                                        }
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
