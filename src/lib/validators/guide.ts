import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 创建指南文章验证器
 */
export const createGuideArticleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long (max 200 characters)")
    .transform((val) => sanitizeHtml(val)),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content too long (max 50000 characters)")
    .transform((val) => sanitizeHtml(val)),
  summary: z
    .string()
    .max(500, "Summary too long (max 500 characters)")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  categoryId: z.string().cuid("Invalid category ID"),
  tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags").optional(),
  coverImage: z.string().url("Invalid cover image URL").optional().nullable(),
});

/**
 * 更新指南文章验证器
 */
export const updateGuideArticleSchema = createGuideArticleSchema.partial();

/**
 * 创建指南分类验证器
 */
export const createGuideCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name too long (max 50 characters)")
    .transform((val) => sanitizeHtml(val)),
  description: z
    .string()
    .max(200, "Description too long (max 200 characters)")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  icon: z.string().max(100).optional(),
  sort: z.number().int().min(0).max(1000).default(0),
});

/**
 * 创建指南标签验证器
 */
export const createGuideTagSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Name too long (max 30 characters)")
    .transform((val) => sanitizeHtml(val)),
  color: z.string().max(20).optional(),
});
