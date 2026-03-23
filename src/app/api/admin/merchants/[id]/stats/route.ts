import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/merchants/[id]/stats - 获取商家统计数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 检查商家是否存在
    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "商家不存在" },
        { status: 404 }
      );
    }

    // 获取统计数据
    const [reviewCount, claimCount] = await Promise.all([
      prisma.review.count({ where: { merchantId: id } }),
      prisma.merchantClaim.count({ where: { merchantId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewCount,
        claims: claimCount,
      },
    });
  } catch (error) {
    console.error("获取商家统计数据失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
