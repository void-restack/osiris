"use client";

import { useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { ICONS } from "./icons";
import { useEffect } from "react";

export default function Attach({ setFiles }: { setFiles: React.Dispatch<React.SetStateAction<File[]>> }) {
    const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: "image/*",
    })

    useEffect(() => {
        console.log('Files changed:', files);
        setFiles(files.map(file => file.file as File));
    }, [files, setFiles]);

  

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-2 align-top">
        <div className="relative inline-block">
          <Button
            variant={"ghost"}
            size={"icon"}
            onClick={openFileDialog}
            aria-haspopup="dialog"
          >
            <ICONS.uploadIcon />
          </Button>
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload file"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}
