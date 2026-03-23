import { z } from "zod";

/**
 * 文件上传验证器
 */
export const uploadSchema = z.object({
  url: z.string().url("Invalid URL"),
  filename: z.string().max(255, "Filename too long").optional(),
  contentType: z.string().max(100, "Content type too long").optional(),
});

/**
 * 图片上传验证器
 */
export const imageUploadSchema = z.object({
  url: z.string().url("Invalid image URL"),
  contentType: z
    .string()
    .refine(
      (val) => val?.startsWith("image/"),
      "Content type must be an image"
    ),
});
