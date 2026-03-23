import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 用户注册验证器
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email too long")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long"),
  name: z
    .string()
    .max(50, "Name too long")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  studentId: z
    .string()
    .max(50, "Student ID too long")
    .regex(/^[a-zA-Z0-9]+$/, "Student ID can only contain letters and numbers")
    .optional()
    .nullable(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number too long")
    .regex(/^1[3-9]\d{9}$/, "Invalid phone number format"),
  school: z
    .string()
    .max(100, "校区名称过长")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional()
    .nullable(),
  major: z
    .string()
    .max(100, "系名称过长")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional()
    .nullable(),
  class: z
    .string()
    .max(50, "Class name too long")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional()
    .nullable(),
  isTeacher: z
    .boolean()
    .optional(),
  title: z
    .string()
    .max(50, "Title too long")
    .optional()
    .nullable(),
});

/**
 * 用户登录验证器
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email too long")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

/**
 * 忘记密码请求验证器
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email too long")
    .email("Invalid email format"),
});

/**
 * 重置密码验证器
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long"),
});

/**
 * 邮箱验证令牌验证器
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
