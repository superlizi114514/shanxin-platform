import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/merchant-reviews
 * 获取商家点评列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      prisma.merchantReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
            },
          },
          merchant: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.merchantReview.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("获取商家点评列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取商家点评列表失败" },
      { status: 500 }
    );
  }
}
