import { useState } from "react";
import {
    useGetUploadFileUrl,
    type FileUploadRequest,
} from "./use-get-upload-file-url";

export interface TemplateUploadState {
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

export const useTemplateUpload = () => {
    const [state, setState] = useState<TemplateUploadState>({
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
            coverImageUrl: null,
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

            let logoUrl = state.logoUrl;
            let coverImageUrl = state.coverImageUrl;

            for (let i = 0; i < uploadUrls.length; i++) {
                const uploadUrl = uploadUrls[i];
                const fileToUpload = filesToUpload[i];

                setState((prev) => ({
                    ...prev,
                    uploadProgress: {
                        ...prev.uploadProgress,
                        [fileToUpload.type]: 50,
                    },
                }));

                const formData = new FormData();
                formData.append("file", fileToUpload.file);

                const uploadResponse = await fetch(uploadUrl.signedUrl, {
                    method: "PUT",
                    body: fileToUpload.file,
                    headers: {
                        "Content-Type": fileToUpload.file.type,
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error(`Failed to upload ${fileToUpload.type}`);
                }

                if (fileToUpload.type === "logo") {
                    logoUrl = uploadUrl.signedUrl.split("?")[0];
                } else {
                    coverImageUrl = uploadUrl.signedUrl.split("?")[0];
                }

                setState((prev) => ({
                    ...prev,
                    uploadProgress: {
                        ...prev.uploadProgress,
                        [fileToUpload.type]: 100,
                    },
                }));
            }

            setState((prev) => ({
                ...prev,
                logoUrl,
                coverImageUrl,
                isUploading: false,
            }));

            return {
                logoUrl,
                coverImageUrl,
            };
        } catch (error) {
            console.error("Upload error:", error);
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
    };
};
