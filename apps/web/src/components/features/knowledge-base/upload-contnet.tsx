"use client";

import { Plus, Search, UploadCloud, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ICONS } from "@/components/icons";
import { McpTagList } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Attach from "@/components/attach";
import { useAddKnowledgeSourceMutation } from "@/lib/mutations";
import { toast } from "sonner";
import { useQueryState } from "nuqs";

interface UploadContentDialogProps {
  knowledgeBaseId: string;
}

export function UploadContentDialog({
  knowledgeBaseId,
}: UploadContentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          Add more source
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100">
        <UploadContentInput
          knowledgeBaseId={knowledgeBaseId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function UploadFile() {
  return (
    <Button
      className="cursor-pointer hover:text-primary-700"
      variant={"ghost"}
      size={"icon"}
    >
      <ICONS.uploadIcon />
    </Button>
  );
}

export function RetrieveMcp() {
  return (
    <Button
      className="cursor-pointer hover:text-primary-700"
      variant={"ghost"}
      size={"icon"}
    >
      <ICONS.retryIcon className="" />
    </Button>
  );
}

type ContentType = "text" | "links" | "social";

interface ParsedContent {
  type: ContentType;
  content: string;
  links?: string[];
  socialSources?: Array<{
    platform: string;
    url: string;
  }>;
}

const SOCIAL_PLATFORMS = {
  "twitter.com": "Twitter",
  "x.com": "X (Twitter)",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "linkedin.com": "LinkedIn",
  "facebook.com": "Facebook",
  "instagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "github.com": "GitHub",
  "reddit.com": "Reddit",
};

function parseContent(input: string): ParsedContent {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = input.match(urlRegex) || [];

  if (urls.length === 0) {
    return { type: "text", content: input };
  }

  const socialSources = urls
    .map((url) => {
      try {
        const domain = new URL(url).hostname.replace("www.", "");
        const platform =
          SOCIAL_PLATFORMS[domain as keyof typeof SOCIAL_PLATFORMS];
        return platform ? { platform, url } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ platform: string; url: string }>;

  if (socialSources.length > 0) {
    return {
      type: "social",
      content: input,
      links: urls,
      socialSources,
    };
  }

  return {
    type: "links",
    content: input,
    links: urls,
  };
}

interface UploadContentInputProps {
  knowledgeBaseId: string;
  onSuccess?: () => void;
}

export function UploadContentInput({
  knowledgeBaseId,
  onSuccess,
}: UploadContentInputProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [input, setInput] = useState("");
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [searchParams, setSearchParams] = useQueryState("tab", {
    defaultValue: "units",
  });

  const addSourceMutation = useAddKnowledgeSourceMutation();

  useEffect(() => {
    if (input.trim()) {
      setParsedContent(parseContent(input));
    } else {
      setParsedContent(null);
    }
  }, [input]);

  useEffect(() => {
    if (files.length > 0) {
      setInput("");
      setParsedContent(null);
    }
  }, [files]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    const parsed = parseContent(pastedText);

    // If pasting links, allow multiple links
    if (parsed.type === "links" || parsed.type === "social") {
      e.preventDefault();
      setInput(pastedText);
    }
  };

  const getPlaceholderText = () => {
    if (files.length > 0) return "";
    if (!input) return "Paste links, text, or upload files...";
    return "";
  };

  const getInputValue = () => {
    if (files.length > 0) {
      const fileNames = files.map((file) => {
        return file?.name || "Unknown file";
      });
      return fileNames.join(", ");
    }
    return input;
  };

  const handleUpload = async () => {
    if (!knowledgeBaseId) {
      toast.error("Knowledge base ID is required");
      return;
    }

    try {
      if (files.length > 0) {
        // Handle file uploads
        for (const file of files) {
          await addSourceMutation.mutateAsync({
            knowledgeBaseId,
            sourceType: "file",
            file,
          });
        }
        setFiles([]);
        onSuccess?.();
        toast.success("Files uploaded successfully");
        setSearchParams("Source");
      } else if (input.trim() && parsedContent) {
        if (parsedContent.type === "links" || parsedContent.type === "social") {
          const urls = parsedContent.links || [];
          for (const url of urls) {
            const sourceType = isYouTubeUrl(url) ? "youtube_url" : "url";
            await addSourceMutation.mutateAsync({
              knowledgeBaseId,
              sourceType,
              source: url,
            });
          }
        } else if (parsedContent.type === "text") {
          // Upload as text content
          await addSourceMutation.mutateAsync({
            knowledgeBaseId,
            sourceType: "text",
            source: input.trim(),
          });
        }
        setInput("");
        setParsedContent(null);
        onSuccess?.();
        setSearchParams("Source");
        toast.success("Content uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const isYouTubeUrl = (url: string): boolean => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return domain === "youtube.com" || domain === "youtu.be";
    } catch {
      return false;
    }
  };

  const renderContent = () => {
    // Don't render content tags when files are present
    if (files.length > 0) return null;

    if (!parsedContent) return null;

    switch (parsedContent.type) {
      case "links":
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {parsedContent.links?.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
              >
                <span>🔗 {new URL(link).hostname}</span>
                <button
                  onClick={() => {
                    const newLinks = parsedContent.links?.filter(
                      (_, i) => i !== index
                    );
                    const newInput = newLinks?.join("\n") || "";
                    setInput(newInput);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        );

      case "social":
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {parsedContent.socialSources?.map((source, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
              >
                <span>📱 {source.platform}</span>
                <button
                  onClick={() => {
                    const newLinks = parsedContent.links?.filter(
                      (link) => link !== source.url
                    );
                    const newInput = newLinks?.join("\n") || "";
                    setInput(newInput);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        );

      case "text":
        return (
          <div className="mt-2 text-xs text-primary-600">
            📝 Text content ({input.length} characters)
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-medium text-primary-800 text-xl">
          Upload all your content
        </h2>
        <p className="text-primary-300 text-sm">
          Add your content and let AI transform it into a resource that boosts
          your future efficiency.
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 rounded-[18px] bg-primary-25 p-4 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={getInputValue()}
            onChange={(e) => !files.length && setInput(e.target.value)}
            onPaste={files.length > 0 ? undefined : handlePaste}
            disabled={files.length > 0}
            className={`h-[84px] w-full resize-none rounded-[12px] border border-none bg-primary-50 p-4 text-primary-700 placeholder:text-primary-300 focus:outline-none focus:ring-0 ${
              files.length > 0 ? "cursor-not-allowed opacity-75" : ""
            }`}
            placeholder={getPlaceholderText()}
            readOnly={files.length > 0}
          />
          {renderContent()}
        </div>
        <div className="flex gap-2 md:flex-row flex-col-reverse justify-between">
          <div className="flex p-0">
            <Attach setFiles={setFiles} />
            <RetrieveMcp />
          </div>
          <div className="flex gap-2">
            {files.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              className="inset-shadow-search-btn"
              disabled={
                (!input.trim() && files.length === 0) ||
                addSourceMutation.isPending
              }
              onClick={handleUpload}
            >
              <span>
                {addSourceMutation.isPending ? "Uploading..." : "Upload"}
              </span>
              <UploadCloud />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
