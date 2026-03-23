import { z } from "zod";

/**
 * 管理员更新用户信息验证器
 */
export const adminUpdateUserSchema = z.object({
  name: z
    .string()
    .max(50, "昵称不能超过 50 个字符")
    .optional(),
  phone: z
    .string()
    .max(20, "手机号过长")
    .regex(/^1[3-9]\d{9}$/, "手机号格式不正确")
    .optional()
    .nullable(),
  role: z
    .enum(["user", "admin"], "角色只能是 user 或 admin")
    .optional(),
  status: z
    .enum(["active", "banned"], "状态只能是 active 或 banned")
    .optional(),
});

/**
 * 管理员重置密码验证器
 */
export const adminResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, "密码至少 6 个字符")
    .max(128, "密码过长"),
});

/**
 * 用户详情查询参数
 */
export const adminUserQuerySchema = z.object({
  includeStats: z.coerce.boolean().default(true),
  includeActivity: z.coerce.boolean().default(false),
});
