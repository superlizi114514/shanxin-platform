import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 创建收藏验证器
 */
export const createCollectionSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  note: z
    .string()
    .max(500, "Note too long (max 500 characters)")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
});

/**
 * 更新收藏验证器
 */
export const updateCollectionSchema = z.object({
  note: z
    .string()
    .max(500, "Note too long (max 500 characters)")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
});
