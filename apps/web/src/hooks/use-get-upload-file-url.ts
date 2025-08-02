import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

const uploadFileRequestSchema = z.object({
  files: z.array(
    z.object({
      filename: z.string(),
      contentType: z.string(),
      size: z.number(),
    })
  ),
});

const uploadUrlSchema = z.object({
  originalFilename: z.string(),
  uniqueFilename: z.string(),
  signedUrl: z.string(),
  expiresAt: z.string(),
});

const uploadFileResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    urls: z.array(uploadUrlSchema),
  }),
});

export type FileUploadRequest = z.infer<typeof uploadFileRequestSchema>["files"][0];
export type UploadUrlResponse = z.infer<typeof uploadUrlSchema>;

export const useGetUploadFileUrl = () => {
  return useMutation({
    mutationFn: async (files: FileUploadRequest[]): Promise<UploadUrlResponse[]> => {
      const requestBody = { files };
      
      const response = await api("/users/upload-files", {
        method: "POST",
        body: requestBody,
        schema: uploadFileResponseSchema,
      });

      if (response.status === "FAILED") {
        throw new Error(response.error || "Failed to get upload URLs");
      }

      return response.data.urls;
    },
  });
}; 