import { z } from "zod";

/**
 * 订单状态枚举
 */
export const orderStatus = [
  "pending",
  "confirmed",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

/**
 * 创建订单验证器
 */
export const createOrderSchema = z.object({
  sellerId: z.string().cuid("Invalid seller ID"),
  items: z.array(z.object({
    productId: z.string().cuid("Invalid product ID"),
    quantity: z.number().int().positive().default(1),
  })).min(1, "Order must have at least one item"),
  note: z
    .string()
    .max(500, "Note too long (max 500 characters)")
    .optional(),
});

/**
 * 更新订单验证器
 */
export const updateOrderSchema = z.object({
  status: z.enum(orderStatus),
});

/**
 * 订单查询参数验证器
 */
export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(["buyer", "seller"]).optional(),
  status: z.enum(orderStatus).optional(),
});
