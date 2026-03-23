import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 商品分类枚举
 */
export const productCategories = [
  "electronics",
  "books",
  "clothing",
  "daily necessities",
  "sports",
  "digital",
  "furniture",
  "cosmetics",
  "food",
  "other",
] as const;

export const productStatus = [
  "available",
  "sold",
  "reserved",
  "deleted",
] as const;

/**
 * 创建商品验证器
 */
export const createProductSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title too long (max 100 characters)")
    .transform((val) => sanitizeHtml(val)),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description too long (max 2000 characters)")
    .transform((val) => sanitizeHtml(val)),
  price: z
    .number()
    .positive("Price must be positive")
    .max(999999, "Price too high"),
  category: z.enum(productCategories),
  schoolId: z.string().cuid("Invalid school ID format").optional().nullable(),
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(10, "Maximum 10 images")
    .optional(),
});

/**
 * 更新商品验证器
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * 商品查询参数验证器
 */
export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.enum(productCategories).optional(),
  search: z.string().max(200, "Search query too long").optional(),
  status: z.enum(productStatus).optional(),
  schoolId: z.string().cuid("Invalid school ID format").optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
});
