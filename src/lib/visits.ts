import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type VisitTargetType = "product" | "merchant" | "news" | "guide";

export interface VisitRecord {
  id: string;
  userId: string | null;
  targetType: VisitTargetType;
  targetId: string;
  createdAt: Date;
}

/**
 * 记录用户访问
 * @param userId - 用户 ID
 * @param targetType - 目标类型 (product, merchant, news, guide)
 * @param targetId - 目标 ID
 * @param deduplicateWindow - 去重时间窗口（毫秒），默认 5 分钟
 */
export async function recordVisit(
  userId: string,
  targetType: VisitTargetType,
  targetId: string,
  deduplicateWindow: number = 5 * 60 * 1000 // 5 分钟
) {
  try {
    // 检查是否已存在最近的访问记录（避免重复记录）
    const windowAgo = new Date(Date.now() - deduplicateWindow);
    const existingVisit = await prisma.visit.findFirst({
      where: {
        userId,
        targetType,
        targetId,
        createdAt: {
          gte: windowAgo,
        },
      },
    });

    if (existingVisit) {
      // 如果时间窗口内已有访问记录，返回现有记录
      return existingVisit;
    }

    const visit = await prisma.visit.create({
      data: {
        userId,
        targetType,
        targetId,
      },
    });

    return visit;
  } catch (error) {
    console.error("Error recording visit:", error);
    throw error;
  }
}

/**
 * 批量记录访问
 */
export async function recordVisits(
  userId: string,
  visits: Array<{ targetType: VisitTargetType; targetId: string }>
) {
  try {
    return await Promise.all(
      visits.map(({ targetType, targetId }) =>
        recordVisit(userId, targetType, targetId)
      )
    );
  } catch (error) {
    console.error("Error recording batch visits:", error);
    throw error;
  }
}

/**
 * 获取用户的访问记录列表
 */
export async function getUserVisits(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    targetType?: VisitTargetType;
  }
) {
  try {
    const { page = 1, limit = 20, targetType } = options || {};
    const skip = (page - 1) * limit;

    const where: { userId: string; targetType?: VisitTargetType } = { userId };
    if (targetType) {
      where.targetType = targetType;
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.visit.count({ where }),
    ]);

    return {
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching user visits:", error);
    throw error;
  }
}

/**
 * 获取用户访问记录总数
 */
export async function getUserVisitCount(
  userId: string,
  targetType?: VisitTargetType
) {
  try {
    const where: { userId: string; targetType?: VisitTargetType } = { userId };
    if (targetType) {
      where.targetType = targetType;
    }

    return await prisma.visit.count({ where });
  } catch (error) {
    console.error("Error fetching visit count:", error);
    return 0;
  }
}

/**
 * 清除用户的访问记录（可选的清理功能）
 */
export async function clearUserVisits(
  userId: string,
  olderThan?: Date
) {
  try {
    const where: { userId: string; createdAt?: { lt: Date } } = { userId };
    if (olderThan) {
      where.createdAt = { lt: olderThan };
    }

    await prisma.visit.deleteMany({ where });
  } catch (error) {
    console.error("Error clearing visits:", error);
    throw error;
  }
}
