import { useState } from "react";
import {
  useGetUploadFileUrl,
  type FileUploadRequest,
} from "./use-get-upload-file-url";

export interface KnowledgeBaseUploadState {
  logoFile: File | null;
  coverImageFile: File | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  isUploading: boolean;
  uploadProgress: {
    logo: number;
    coverImage: number;
  };
  error: string | null;
}

export const useKnowledgeBaseUpload = () => {
  const [state, setState] = useState<KnowledgeBaseUploadState>({
    logoFile: null,
    coverImageFile: null,
    logoUrl: null,
    coverImageUrl: null,
    isUploading: false,
    uploadProgress: {
      logo: 0,
      coverImage: 0,
    },
    error: null,
  });

  const uploadUrlMutation = useGetUploadFileUrl();

  const setLogoFile = (file: File | null) => {
    setState((prev) => ({
      ...prev,
      logoFile: file,
      logoUrl: null,
    }));
  };

  const setCoverImageFile = (file: File | null) => {
    setState((prev) => ({
      ...prev,
      coverImageFile: file,
      coverImageUrl: null, // Reset URL when file changes
    }));
  };



  const uploadFiles = async (): Promise<{
    logoUrl: string | null;
    coverImageUrl: string | null;
  }> => {
    const { logoFile, coverImageFile } = state;

    if (!logoFile && !coverImageFile) {
      return {
        logoUrl: state.logoUrl,
        coverImageUrl: state.coverImageUrl,
      };
    }

    setState((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
      uploadProgress: { logo: 0, coverImage: 0 },
    }));

    try {
      const filesToUpload: Array<{
        request: FileUploadRequest;
        type: "logo" | "coverImage";
        file: File;
      }> = [];

      if (logoFile) {
        filesToUpload.push({
          request: {
            filename: logoFile.name,
            contentType: logoFile.type,
            size: logoFile.size,
          },
          type: "logo",
          file: logoFile,
        });
      }

      if (coverImageFile) {
        filesToUpload.push({
          request: {
            filename: coverImageFile.name,
            contentType: coverImageFile.type,
            size: coverImageFile.size,
          },
          type: "coverImage",
          file: coverImageFile,
        });
      }

      const uploadUrls = await uploadUrlMutation.mutateAsync(
        filesToUpload.map((f) => f.request)
      );
      console.log("Received signed URLs:", uploadUrls);

      let logoUrl = state.logoUrl;
      let coverImageUrl = state.coverImageUrl;

      for (let i = 0; i < uploadUrls.length; i++) {
        const uploadUrl = uploadUrls[i];
        const fileInfo = filesToUpload[i];
        const { file, type } = fileInfo;

        setState((prev) => ({
          ...prev,
          uploadProgress: {
            ...prev.uploadProgress,
            [type]: 25,
          },
        }));

        console.log(`Uploading ${type} to:`, uploadUrl.signedUrl);
        console.log(`File type: ${file.type}, File size: ${file.size}`);
        console.log(`Using backend unique filename: ${uploadUrl.uniqueFilename}`);

        // Create a new File object with the unique filename from backend
        const renamedFile = new File([file], uploadUrl.uniqueFilename, {
          type: file.type,
          lastModified: file.lastModified,
        });

        console.log("Renamed file:", renamedFile, renamedFile.name);

        const uploadResponse = await fetch(uploadUrl.signedUrl, {
          method: "PUT",
          body: renamedFile,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Failed to upload ${type === "logo" ? "logo" : "cover image"}`
          );
        }

        setState((prev) => ({
          ...prev,
          uploadProgress: {
            ...prev.uploadProgress,
            [type]: 100,
          },
        }));

        // Use the backend-generated unique filename for the final URL
        const finalUrl = `https://storage.googleapis.com/osiris-public-bucket-1/${uploadUrl.uniqueFilename}`;

        if (type === "logo") {
          logoUrl = finalUrl;
        } else if (type === "coverImage") {
          coverImageUrl = finalUrl;
        }
      }

      setState((prev) => ({
        ...prev,
        logoUrl,
        coverImageUrl,
        isUploading: false,
      }));

      return { logoUrl, coverImageUrl };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : "Upload failed",
      }));
      throw error;
    }
  };

  const reset = () => {
    setState({
      logoFile: null,
      coverImageFile: null,
      logoUrl: null,
      coverImageUrl: null,
      isUploading: false,
      uploadProgress: {
        logo: 0,
        coverImage: 0,
      },
      error: null,
    });
  };

  return {
    state,
    setLogoFile,
    setCoverImageFile,
    uploadFiles,
    reset,
    isUploading: state.isUploading || uploadUrlMutation.isPending,
  };
};
