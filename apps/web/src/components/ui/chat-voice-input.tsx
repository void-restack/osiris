"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useVoiceRecording } from "@/hooks/use-voice-recording";

interface ChatVoiceInputProps {
    className?: string;
    visualizerBars?: number;
}

export function ChatVoiceInput({
    className,
    visualizerBars = 24
}: ChatVoiceInputProps) {
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
        <div className={cn("w-full", className)}>
            <div className="relative w-full flex items-center flex-col gap-2">
                <button
                    className={cn(
                        "group w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                        isRecording
                            ? "bg-red-100 hover:bg-red-200 text-red-600"
                            : "bg-primary-100 hover:bg-primary-200 text-primary-600"
                    )}
                    type="button"
                    onClick={handleClick}
                >
                    {isRecording ? (
                        <div
                            className="w-5 h-5 rounded-sm animate-spin bg-red-600"
                            style={{ animationDuration: "3s" }}
                        />
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>

                {isRecording && (
                    <>
                        <span className="font-mono text-xs text-primary-600">
                            {formatTime(time)}
                        </span>

                        <div className="h-3 w-32 flex items-center justify-center gap-0.5">
                            {[...Array(visualizerBars)].map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-0.5 rounded-full transition-all duration-300",
                                        isRecording
                                            ? "bg-red-500 animate-pulse"
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

                        <p className="text-xs text-primary-600">
                            Listening...
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
