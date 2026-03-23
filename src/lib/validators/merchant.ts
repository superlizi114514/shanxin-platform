import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 创建商家验证器
 */
export const createMerchantSchema = z.object({
  name: z
    .string()
    .min(1, "Merchant name is required")
    .max(100, "Merchant name too long (max 100 characters)")
    .transform((val) => sanitizeHtml(val)),
  description: z
    .string()
    .max(2000, "Description too long (max 2000 characters)")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  address: z
    .string()
    .max(200, "Address too long")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  logo: z.string().url("Invalid logo URL").optional().nullable(),
  coverImage: z.string().url("Invalid cover image URL").optional().nullable(),
  contactPhone: z
    .string()
    .max(20, "Phone number too long")
    .regex(/^1[3-9]\d{9}$|^0\d{2,3}-\d{7,8}$/, "Invalid phone number format")
    .optional(),
  contactWechat: z
    .string()
    .max(50, "WeChat ID too long")
    .optional(),
  categoryId: z.string().cuid("Invalid category ID").optional().nullable(),
  schoolId: z.string().cuid("Invalid school ID").optional().nullable(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

/**
 * 更新商家验证器
 */
export const updateMerchantSchema = createMerchantSchema.partial();

/**
 * 商家查询参数验证器
 */
export const merchantQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200, "Search query too long").optional(),
  categoryId: z.string().cuid("Invalid category ID").optional(),
  schoolId: z.string().cuid("Invalid school ID").optional(),
});
