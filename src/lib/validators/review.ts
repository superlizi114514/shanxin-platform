import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 创建评价验证器
 */
export const createReviewSchema = z.object({
  merchantId: z.string().cuid("Invalid merchant ID"),
  rating: z
    .number()
    .int()
    .min(1, "评分至少 1 星")
    .max(5, "评分最多 5 星"),
  content: z
    .string()
    .min(10, "点评内容至少 10 个字")
    .max(1000, "点评内容最多 1000 个字")
    .transform((val) => sanitizeHtml(val)),
  images: z.array(z.string().url("无效的图片 URL")).optional().default([]),
  tags: z.array(z.string().max(50)).max(5, "最多 5 个标签").optional(),
});

/**
 * 更新评价验证器
 */
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "评分至少 1 星")
    .max(5, "评分最多 5 星")
    .optional(),
  content: z
    .string()
    .max(1000, "点评内容最多 1000 个字")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  images: z.array(z.string().url("无效的图片 URL")).optional(),
  tags: z.array(z.string().max(50)).max(5, "最多 5 个标签").optional(),
});

/**
 * 查询参数验证
 */
export const reviewQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  merchantId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z.enum(["newest", "highest", "lowest", "helpful"]).default("newest"),
  status: z.enum(["pending", "approved", "rejected", "hidden"]).optional().default("approved"),
});

/**
 * 点评回复验证
 */
export const createReplySchema = z.object({
  content: z
    .string()
    .min(1, "回复内容不能为空")
    .max(500, "回复内容最多 500 个字"),
});

/**
 * 点评举报验证
 */
export const createReportSchema = z.object({
  reason: z.enum(["虚假广告", "恶意诋毁", "不当内容", "其他", "垃圾广告", "虚假内容", "仇恨言论"]),
});

/**
 * 审核操作验证
 */
export const auditReviewSchema = z.object({
  action: z.enum(["approve", "reject", "hide", "delete"]),
  reason: z.string().optional(),
});
