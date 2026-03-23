import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 创建通知验证器
 */
export const createNotificationSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  type: z.string().max(50, "Type too long"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long (max 200 characters)")
    .transform((val) => sanitizeHtml(val)),
  content: z
    .string()
    .min(1, "Content is required")
    .max(1000, "Content too long (max 1000 characters)")
    .transform((val) => sanitizeHtml(val)),
  link: z.string().url("Invalid link URL").optional().nullable(),
});

/**
 * 通知查询参数验证器
 */
export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.string().max(50).optional(),
  unread: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});
