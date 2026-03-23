import { z } from "zod";
import { sanitizeHtml } from "./index";

/**
 * 课程类型枚举
 */
export const courseTypes = ["必修", "选修", "通识", "专业", "其他"] as const;

/**
 * 创建课程验证器
 */
export const createCourseSchema = z.object({
  name: z
    .string()
    .min(1, "Course name is required")
    .max(100, "Course name too long (max 100 characters)")
    .transform((val) => sanitizeHtml(val)),
  teacher: z
    .string()
    .max(50, "Teacher name too long")
    .transform((val) => (val ? sanitizeHtml(val) : undefined))
    .optional(),
  credit: z
    .number()
    .positive("Credit must be positive")
    .max(20, "Credit too high")
    .optional(),
  type: z.enum(courseTypes).optional(),
  schedule: z
    .array(
      z.object({
        day: z.number().int().min(1).max(7),
        week: z.number().int().min(1).max(20),
        session: z.number().int().min(1).max(12),
        room: z.string().max(100).optional(),
      })
    )
    .max(20, "Maximum 20 schedule items")
    .optional(),
  semesterId: z.string().cuid("Invalid semester ID").optional(),
});

/**
 * 更新课程验证器
 */
export const updateCourseSchema = createCourseSchema.partial();

/**
 * 课程导入验证器
 */
export const importCourseSchema = z.object({
  pdfUrl: z.string().url("Invalid PDF URL").optional(),
  pdfBase64: z.string().optional(),
  semesterId: z.string().cuid("Invalid semester ID").optional(),
});
