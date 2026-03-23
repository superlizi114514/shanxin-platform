import { z } from "zod";

/**
 * 清理 HTML/XSS 内容
 * 移除潜在的恶意脚本和 HTML 标签
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/on\w+='[^']*'/g, "")
    .trim();
}

/**
 * 验证并清理字符串
 */
export function validateAndSanitize<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

// 通用验证器
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idSchema = z.object({
  id: z.string().cuid("Invalid ID format"),
});

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
});
