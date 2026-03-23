import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createReplySchema } from "@/lib/validators/review";
import { z } from "zod";

/**
 * POST /api/reviews/[id]/reply - 回复点评
 * 权限：仅商家或管理员可回复
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // 验证输入
    const validatedData = createReplySchema.parse(body);
    const { content } = validatedData;

    // 检查点评存在
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        merchant: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "点评不存在" },
        { status: 404 }
      );
    }

    // 权限检查：管理员 或 商家 owner
    const isAdmin = session.user.role === "admin";
    const isMerchantOwner = review.merchant?.id && review.merchant.claimedBy === session.user.id;

    if (!isAdmin && !isMerchantOwner) {
      return NextResponse.json(
        { success: false, error: "无权限回复" },
        { status: 403 }
      );
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: id,
        userId: session.user.id,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: messages },
        { status: 400 }
      );
    }
    console.error("回复点评失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
