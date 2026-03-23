import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 发送消息验证器
 */
export const sendMessageSchema = z.object({
  receiverId: z.string().cuid("Invalid receiver ID"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(2000, "Message too long (max 2000 characters)")
    .transform((val) => sanitizeHtml(val)),
});

/**
 * 消息查询参数验证器
 */
export const messageQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  userId: z.string().cuid("Invalid user ID").optional(),
});
