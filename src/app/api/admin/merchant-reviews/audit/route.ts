import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/merchant-reviews/audit
 * 批量审核商家点评
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { reviewIds, status, rejectReason } = body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { error: "请选择要审核的点评" },
        { status: 400 }
      );
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "审核状态不合法" },
        { status: 400 }
      );
    }

    // 批量更新
    await prisma.merchantReview.updateMany({
      where: {
        id: { in: reviewIds },
      },
      data: {
        status,
      },
    });

    // 如果是拒绝，记录拒绝原因（可以添加到日志）
    if (status === "rejected" && rejectReason) {
      // 这里可以添加审核日志功能
      console.log("拒绝原因:", rejectReason);
    }

    return NextResponse.json({
      success: true,
      message: `已${status === "approved" ? "通过" : "拒绝"} ${reviewIds.length} 个点评`,
    });
  } catch (error) {
    console.error("批量审核失败:", error);
    return NextResponse.json(
      { success: false, error: "批量审核失败" },
      { status: 500 }
    );
  }
}
