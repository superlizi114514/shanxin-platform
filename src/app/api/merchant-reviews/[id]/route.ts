import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 删除商家评价
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id as string;

    // 检查评价是否存在且属于当前用户
    const review = await prisma.merchantReview.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: "评价不存在" }, { status: 404 });
    }

    if (review.userId !== userId) {
      return NextResponse.json({ error: "无权删除该评价" }, { status: 403 });
    }

    // 删除评价（级联删除图片）
    await prisma.merchantReview.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "评价已删除",
    });
  } catch (error) {
    console.error("删除评价失败:", error);
    return NextResponse.json(
      { error: "删除评价失败" },
      { status: 500 }
    );
  }
}
